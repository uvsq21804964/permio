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

function redirectWithError(returnUrl: string, errorCode: string) {
  return NextResponse.redirect(`${returnUrl}?error=${errorCode}`, {
    status: 303,
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const form = await req.formData();
  const subscriptionId = getString(form, 'subscriptionId');
  const returnUrl = getString(form, 'returnUrl') || '/';

  if (!subscriptionId) {
    return redirectWithError(returnUrl, 'missing_subscription');
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
  if (!myCustomerId) {
    return redirectWithError(returnUrl, 'missing_customer');
  }

  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);

    const subCustomerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

    if (!subCustomerId || myCustomerId !== subCustomerId) {
      return redirectWithError(returnUrl, 'forbidden_subscription');
    }

    // ✅ "Schedule closure" = annule à la fin de période
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Ton webhook mettra à jour la BDD (status/cancel_at_period_end)
    return NextResponse.redirect(`${returnUrl}?canceled=1`, { status: 303 });
  } catch (e) {
    console.error('[stripe/cancel] error', e);
    return redirectWithError(returnUrl, 'cancel_failed');
  }
}
