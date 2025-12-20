// app/api/stripe/subscription/cancel/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe';
import { sql } from '@/lib/db';

export const runtime = 'nodejs';

function getString(form: FormData, key: string) {
  const v = form.get(key);
  return typeof v === 'string' ? v : '';
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const form = await req.formData();
  const subscriptionId = getString(form, 'subscriptionId');
  const returnUrl = getString(form, 'returnUrl') || '/';

  if (!subscriptionId) {
    return NextResponse.redirect(`${returnUrl}?error=missing_subscription`, {
      status: 303,
    });
  }

  // (Optionnel mais recommandé) : vérifier que l’abonnement appartient bien à l’utilisateur
  // On compare le customer Stripe du user en BDD avec celui de l’abonnement.
  const me = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;
  const myCustomerId = me[0]?.stripe_customer_id ?? null;

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    const subCustomerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

    if (myCustomerId && subCustomerId && myCustomerId !== subCustomerId) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ✅ "Schedule closure" = annule à la fin de période
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Ton webhook mettra à jour la BDD (status/cancel_at_period_end)
    return NextResponse.redirect(`${returnUrl}?canceled=1`, { status: 303 });
  } catch (e) {
    console.error('[stripe/cancel] error', e);
    return NextResponse.redirect(`${returnUrl}?error=cancel_failed`, {
      status: 303,
    });
  }
}
