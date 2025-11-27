// /app/api/stripe/checkout/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const user = await currentUser();
  const customerId = (user?.privateMetadata as any)?.stripeCustomerId as
    | string
    | undefined;

  const form = await req.formData();
  const priceLookupKey = String(form.get('priceLookupKey') || '');
  const mode = String(form.get('mode') || 'subscription') as
    | 'subscription'
    | 'payment';
  const successUrl = String(
    form.get('successUrl') ||
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1`
  );
  const cancelUrl = String(
    form.get('cancelUrl') ||
      `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`
  );

  if (!priceLookupKey)
    return new NextResponse('Missing priceLookupKey', { status: 400 });

  // Récupère l'ID du price via lookup_key (plus pratique que stocker l'ID)
  const prices = await stripe.prices.list({
    lookup_keys: [priceLookupKey],
    expand: ['data.product'],
  });
  const price = prices.data[0];
  if (!price)
    return new NextResponse('Unknown price lookup key', { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode,
    ...(customerId ? { customer: customerId } : {}),
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=1`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
