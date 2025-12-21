// /app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import Stripe from 'stripe';

export const runtime = 'nodejs';

function normalizeCheckoutLocale(
  value: FormDataEntryValue | null
): Stripe.Checkout.SessionCreateParams.Locale {
  const raw = String(value ?? 'auto').toLowerCase();
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('en')) return 'en';
  return 'auto';
}

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

  // ✅ règle devise
  const expectedCurrency = checkoutLocale === 'fr' ? 'eur' : 'usd';

  // ✅ slug base (si tu veux le garder flexible)
  const planSlug = String(form.get('planSlug') || 'magic_monthly');

  // ✅ lookup key final
  const priceLookupKey = `${planSlug}_${expectedCurrency}`; // magic_monthly_eur | magic_monthly_usd

  // ✅ Récupère le price via lookup_key
  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    active: true,
    limit: 10,
  });

  // ✅ Sélection stricte
  const price = prices.data.find(
    (p) => p.lookup_key === priceLookupKey && p.currency === expectedCurrency
  );

  if (!price) {
    return new NextResponse(
      `Price not found for lookup_key=${priceLookupKey} currency=${expectedCurrency}`,
      { status: 400 }
    );
  }

  // 1) Lire stripe_customer_id en BDD
  const db = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;

  let customerId = db[0]?.stripe_customer_id ?? null;

  // 2) Si absent, créer un customer Stripe + persister en BDD
  if (!customerId) {
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      metadata: { clerkUserId: userId },
    });

    customerId = customer.id;

    await sql`
      update "User"
      set stripe_customer_id = ${customerId}
      where id = ${userId}
    `;
  }

  // 3) Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: true,

    locale: checkoutLocale,

    client_reference_id: userId,
    metadata: { clerkUserId: userId },

    success_url: successUrl,
    cancel_url: cancelUrl,

    ...(mode === 'subscription'
      ? {
          subscription_data: {
            metadata: { clerkUserId: userId },
          },
        }
      : {}),
  });

  if (!session.url) {
    return new NextResponse('Stripe session has no URL', { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
