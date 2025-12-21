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

  // ✅ langue Stripe Checkout (UI)
  const checkoutLocale = normalizeCheckoutLocale(form.get('checkoutLocale'));

  // ✅ devise attendue: FR => EUR, sinon USD
  const expectedCurrency = checkoutLocale === 'fr' ? 'eur' : 'usd';

  // ✅ slug base (optionnel)
  const planSlug = String(form.get('planSlug') || 'magic_monthly');

  // ✅ lookup key final
  const priceLookupKey = `${planSlug}_${expectedCurrency}`;

  // --- DEBUG ---
  console.log('[checkout] raw checkoutLocale:', form.get('checkoutLocale'));
  console.log('[checkout] normalized checkoutLocale:', checkoutLocale);
  console.log('[checkout] expectedCurrency:', expectedCurrency);
  console.log('[checkout] priceLookupKey:', priceLookupKey);
  console.log(
    '[checkout] STRIPE_SECRET_KEY prefix:',
    process.env.STRIPE_SECRET_KEY?.slice(0, 8) // sk_test_ ou sk_live_
  );
  // ------------

  // ✅ 1) Récupère le price via lookup_key
  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    active: true,
    limit: 10,
  });

  console.log(
    '[checkout] prices found:',
    prices.data.map((p) => ({
      id: p.id,
      lookup_key: p.lookup_key,
      currency: p.currency,
      active: p.active,
      unit_amount: p.unit_amount,
      recurring: p.recurring,
    }))
  );

  // ✅ 2) Sélection stricte
  const price = prices.data.find(
    (p) => p.lookup_key === priceLookupKey && p.currency === expectedCurrency
  );

  if (!price) {
    return new NextResponse(
      `Price not found for lookup_key=${priceLookupKey} currency=${expectedCurrency}`,
      { status: 400 }
    );
  }

  // 3) Lire stripe_customer_id en BDD
  const db = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;
  let customerId = db[0]?.stripe_customer_id ?? null;

  // 4) Si absent, créer un customer Stripe + persister en BDD
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

  // 5) Créer la Checkout Session
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

  // --- DEBUG SESSION ---
  console.log('[checkout] session.id:', session.id);
  console.log('[checkout] session.url:', session.url);

  // ✅ Imparable: re-fetch la session avec line_items expand pour voir la vraie devise
  const sessionFull = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['line_items.data.price'],
  });

  console.log(
    '[checkout] sessionFull line items:',
    sessionFull.line_items?.data.map((li) => ({
      lineItemId: li.id,
      quantity: li.quantity,
      priceId: li.price?.id,
      currency: li.price?.currency,
      unit_amount: li.price?.unit_amount,
      lookup_key: (li.price as any)?.lookup_key,
    }))
  );
  // ---------------------

  if (!session.url) {
    return new NextResponse('Stripe session has no URL', { status: 500 });
  }

  // 303 = normal (redirect POST -> GET)
  return NextResponse.redirect(session.url, { status: 303 });
}
