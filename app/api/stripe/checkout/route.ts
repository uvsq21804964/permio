// /app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

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
  const priceLookupKey = String(form.get('priceLookupKey') || '');
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

  if (!priceLookupKey)
    return new NextResponse('Missing priceLookupKey', { status: 400 });

  // Récupère l'ID du price via lookup_key
  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    expand: ['data.product'],
  });
  const price = prices.data[0];
  if (!price)
    return new NextResponse('Unknown price lookup key', { status: 400 });

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

  // 3) Créer la Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: true,

    // 🔗 lien user -> Stripe (indispensable pour webhook robuste)
    client_reference_id: userId,
    metadata: { clerkUserId: userId },

    success_url: successUrl,
    cancel_url: cancelUrl,

    ...(mode === 'subscription'
      ? {
          subscription_data: {
            metadata: { clerkUserId: userId }, // ✅ userId directement sur la Subscription
          },
        }
      : {}),
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
