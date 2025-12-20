import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export const runtime = 'nodejs';

type DbRow = {
  role: string;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: Date | null;
  subscription_cancel_at_period_end: boolean | null;
};

function toDateFromUnix(unixSeconds?: number | null) {
  return unixSeconds ? new Date(unixSeconds * 1000) : null;
}

export async function GET() {
  const { userId } = await auth();

  // Page publique => doit répondre sans auth
  if (!userId) {
    return NextResponse.json(
      { loggedIn: false, role: null, subscription_status: null },
      { status: 200 }
    );
  }

  const rows = await sql`
    select
      role,
      subscription_status,
      stripe_customer_id,
      stripe_subscription_id,
      subscription_current_period_end,
      subscription_cancel_at_period_end
    from "User"
    where id = ${userId}
    limit 1
  `;
  const me = rows[0];

  if (!me) {
    return NextResponse.json(
      { loggedIn: true, role: null, subscription_status: null },
      { status: 200 }
    );
  }

  // Si instructor pas "active" mais on a un customer Stripe => on tente un refresh depuis Stripe
  if (
    me.role === 'instructor' &&
    me.stripe_customer_id &&
    me.subscription_status !== 'active'
  ) {
    try {
      const active = await stripe.subscriptions.list({
        customer: me.stripe_customer_id,
        status: 'active',
        limit: 1,
      });

      const sub = active.data[0];

      if (sub) {
        await sql`
          update "User"
          set
            stripe_subscription_id = ${sub.id},
            subscription_status = ${sub.status},
            subscription_current_period_end = ${toDateFromUnix(
              (sub as any).current_period_end
            )},
            subscription_cancel_at_period_end = ${Boolean(
              (sub as any).cancel_at_period_end
            )}
          where id = ${userId}
        `;

        return NextResponse.json(
          {
            loggedIn: true,
            role: me.role,
            subscription_status: 'active',
          },
          { status: 200 }
        );
      }
    } catch {
      // si Stripe échoue, on retombe sur la BDD (comportement safe)
    }
  }

  return NextResponse.json(
    {
      loggedIn: true,
      role: me.role,
      subscription_status: me.subscription_status,
    },
    { status: 200 }
  );
}
