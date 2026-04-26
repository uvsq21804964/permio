import { NextResponse } from 'next/server';
import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';

import { sql } from '@/lib/db';
import { resolveStripeCustomerId } from '@/lib/server/stripe-customer';
import { syncStripeSubscriptionStateForUser } from '@/lib/server/stripe-subscription-state';

export const runtime = 'nodejs';

type DbRow = {
  role: string;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: Date | null;
  subscription_cancel_at_period_end: boolean | null;
};

export async function GET() {
  const { userId } = await auth();

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
  const me = rows[0] as DbRow | undefined;

  if (!me) {
    return NextResponse.json(
      { loggedIn: true, role: null, subscription_status: null },
      { status: 200 }
    );
  }

  if (me.role === 'instructor') {
    try {
      if (!me.stripe_customer_id) {
        const clerk = await getClerkClient();
        const user = await clerk.users.getUser(userId);
        await resolveStripeCustomerId({ user, userId });
      }

      const synced = await syncStripeSubscriptionStateForUser(userId);
      return NextResponse.json(
        {
          loggedIn: true,
          role: me.role,
          subscription_status: synced?.subscription_status ?? null,
        },
        { status: 200 }
      );
    } catch {
      // Fallback to DB state if Stripe or Clerk is temporarily unavailable.
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
