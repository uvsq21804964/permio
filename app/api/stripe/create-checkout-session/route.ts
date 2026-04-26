// app/api/stripe/create-checkout-session/route.ts
import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/api/auth-server';
import { getRemainingBillingTrialDays } from '@/lib/server/billing-trial';
import {
  createManagedCheckoutSession,
  normalizeCheckoutLocale,
} from '@/lib/server/stripe-checkout';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      cancelUrl?: string;
      checkoutLocale?: string;
      lookupKey?: string;
      priceId?: string;
      successUrl?: string;
      trialDays?: number;
    };
    const {
      cancelUrl,
      checkoutLocale,
      lookupKey,
      priceId,
      successUrl,
      trialDays,
    } = body;

    const { auth: apiAuth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!apiAuth) {
      return response;
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!lookupKey && !priceId) {
      return NextResponse.json(
        { error: 'Missing `lookupKey` or `priceId`' },
        { status: 400 }
      );
    }

    const me = await currentUser();
    const email =
      me?.emailAddresses?.[0]?.emailAddress ||
      me?.primaryEmailAddress?.emailAddress ||
      undefined;
    const effectiveTrialDays =
      trialDays ?? (await getRemainingBillingTrialDays(userId));

    const session = await createManagedCheckoutSession({
      cancelUrl:
        cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/plans/cancel`,
      checkoutLocale: normalizeCheckoutLocale(checkoutLocale),
      email,
      lookupKey,
      mode: 'subscription',
      priceId,
      successUrl:
        successUrl ||
        `${process.env.NEXT_PUBLIC_APP_URL}/plans/success?session_id={CHECKOUT_SESSION_ID}`,
      trialDays: effectiveTrialDays,
      userId,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Server error' },
      { status: 500 }
    );
  }
}
