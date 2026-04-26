// /app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

import { stripe } from '@/lib/stripe';
import { getRemainingBillingTrialDays } from '@/lib/server/billing-trial';
import {
  createManagedCheckoutSession,
  normalizeCheckoutLocale,
} from '@/lib/server/stripe-checkout';
import { devLogger } from '@/lib/shared/dev-logger';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const user = await currentUser();
  const email =
    user?.emailAddresses?.[0]?.emailAddress ||
    user?.primaryEmailAddress?.emailAddress ||
    undefined;

  const form = await req.formData();

  const mode = String(form.get('mode') || 'subscription') as
    | 'subscription'
    | 'payment';

  const successUrl = String(
    form.get('successUrl') ||
      `${process.env.NEXT_PUBLIC_APP_URL}/invoices?success=1&session_id={CHECKOUT_SESSION_ID}`
  );

  const cancelUrl = String(
    form.get('cancelUrl') ||
      `${process.env.NEXT_PUBLIC_APP_URL}/invoices?canceled=1`
  );

  const checkoutLocale = normalizeCheckoutLocale(form.get('checkoutLocale'));
  const planSlug = String(form.get('planSlug') || 'magic_monthly');
  const lookupKey = String(form.get('priceLookupKey') || '').trim() || null;
  const trialDays = mode === 'subscription'
    ? await getRemainingBillingTrialDays(userId)
    : null;

  devLogger.log('[checkout] request context', {
    rawCheckoutLocale: form.get('checkoutLocale'),
    checkoutLocale,
    lookupKey,
    planSlug,
    trialDays,
    stripeSecretKeyPrefix: process.env.STRIPE_SECRET_KEY?.slice(0, 8),
  });

  const session = await createManagedCheckoutSession({
    cancelUrl,
    checkoutLocale,
    email,
    lookupKey,
    mode,
    planSlug,
    successUrl,
    trialDays,
    userId,
  });

  devLogger.log('[checkout] session.id', session.id);
  devLogger.log('[checkout] session.url', session.url);

  const sessionFull = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price'],
  });

  devLogger.log(
    '[checkout] sessionFull line items:',
    sessionFull.line_items?.data.map((lineItem) => ({
      lineItemId: lineItem.id,
      quantity: lineItem.quantity,
      priceId: lineItem.price?.id,
      currency: lineItem.price?.currency,
      unit_amount: lineItem.price?.unit_amount,
      lookup_key: (lineItem.price as { lookup_key?: string } | null)?.lookup_key,
    }))
  );

  if (!session.url) {
    return new NextResponse('Stripe session has no URL', { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
