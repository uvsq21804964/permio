// app/api/stripe/create-checkout-session/route.ts
import { currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { requireUser } from '@/lib/api/auth-server';

export const runtime = 'nodejs'; // sécurité : forcer le runtime Node

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!); // sk_test_... / sk_live_...

type SupportedCurrency = 'EUR' | 'USD';

export async function POST(req: NextRequest) {
  try {
    // Parse du body (et protection si vide)
    const body = (await req.json().catch(() => ({}))) as {
      lookupKey?: string; // ← EUR ou USD selon le bouton
      priceId?: string; // ← optionnel, si tu veux forcer un Price précis
      trialDays?: number; // ← optionnel
    };
    const { lookupKey, priceId, trialDays } = body;

    // (Optionnel) Auth Clerk si tu veux forcer l’utilisateur connecté
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    let email: string | undefined = undefined;
    if (!auth) {
      return response;
    } else {
      const me = await currentUser();
      email = me?.emailAddresses?.[0]?.emailAddress;
    }

    // Détermination du price à utiliser
    let effectivePriceId = priceId;

    if (!effectivePriceId) {
      if (!lookupKey) {
        return NextResponse.json(
          { error: 'Missing `lookupKey` or `priceId`' },
          { status: 400 }
        );
      }

      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        type: 'recurring', // si ce sont des abonnements
        limit: 1,
        expand: ['data.product'],
      });

      const price = prices.data[0];
      if (!price) {
        return NextResponse.json(
          { error: `Unknown lookupKey: ${lookupKey}` },
          { status: 400 }
        );
      }
      effectivePriceId = price.id;
    }

    if (!effectivePriceId) {
      return NextResponse.json(
        { error: 'Missing `lookupKey` or `priceId` (unable to resolve price)' },
        { status: 400 }
      );
    }

    // Création de la session Checkout (abonnement)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: effectivePriceId, quantity: 1 }],
      ...(trialDays && trialDays > 0
        ? { subscription_data: { trial_period_days: Math.floor(trialDays) } }
        : {}),

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/plans/cancel`,
      customer_email: email, // optionnel si tu utilises Clerk
      allow_promotion_codes: true, // pratique si tu offres des codes promo
      // customer_creation: 'always',    // utile si tu veux forcer la création d’un customer
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
