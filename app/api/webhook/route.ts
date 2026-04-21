import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-02-25.clover',
  });
  const sig = req.headers.get('stripe-signature')!;
  const payload = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'invoice.paid':
      // marquer l’accès actif
      break;
    case 'invoice.payment_failed':
      // notifier / restreindre
      break;
    case 'customer.subscription.deleted':
      // couper l’accès
      break;
  }
  return NextResponse.json({ received: true });
}
