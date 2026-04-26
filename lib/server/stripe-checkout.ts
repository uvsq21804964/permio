import Stripe from 'stripe';

import { sql } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export type SupportedCheckoutMode = 'payment' | 'subscription';

type CheckoutLocale = Stripe.Checkout.SessionCreateParams.Locale;

type ResolveCheckoutPriceParams = {
  checkoutLocale?: CheckoutLocale;
  lookupKey?: string | null;
  planSlug?: string | null;
  priceId?: string | null;
};

type CreateManagedCheckoutSessionParams = {
  allowPromotionCodes?: boolean;
  cancelUrl: string;
  checkoutLocale?: CheckoutLocale;
  email?: string;
  lookupKey?: string | null;
  mode?: SupportedCheckoutMode;
  planSlug?: string | null;
  priceId?: string | null;
  successUrl: string;
  trialDays?: number | null;
  userId: string;
};

export function normalizeCheckoutLocale(
  rawValue: FormDataEntryValue | string | null | undefined
): CheckoutLocale {
  const raw = String(rawValue ?? 'auto').toLowerCase();
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('en')) return 'en';
  return 'auto';
}

async function getOrCreateStripeCustomerId(params: {
  email?: string;
  userId: string;
}) {
  const { email, userId } = params;

  const db = await sql`
    select stripe_customer_id
    from "User"
    where id = ${userId}
    limit 1
  `;
  let customerId = db[0]?.stripe_customer_id ?? null;

  if (customerId) {
    return customerId;
  }

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

  return customerId;
}

async function resolveCheckoutPrice(params: ResolveCheckoutPriceParams) {
  const { checkoutLocale = 'auto', lookupKey, planSlug, priceId } = params;

  if (priceId) {
    const price = await stripe.prices.retrieve(priceId);
    if (!price.active) {
      throw new Error(`Price is inactive: ${priceId}`);
    }
    return price;
  }

  const normalizedLookupKey =
    lookupKey?.trim() ||
    `${(planSlug ?? 'magic_monthly').trim()}_${
      checkoutLocale === 'fr' ? 'eur' : 'usd'
    }`;

  const prices = await stripe.prices.list({
    lookup_keys: [normalizedLookupKey],
    active: true,
    limit: 10,
  });

  const expectedCurrency = checkoutLocale === 'fr' ? 'eur' : 'usd';
  const matchingPrice =
    prices.data.find(
      (price) =>
        price.lookup_key === normalizedLookupKey &&
        (checkoutLocale === 'auto' || price.currency === expectedCurrency)
    ) ?? prices.data[0];

  if (!matchingPrice) {
    throw new Error(
      `Price not found for lookup_key=${normalizedLookupKey}${
        checkoutLocale === 'auto' ? '' : ` currency=${expectedCurrency}`
      }`
    );
  }

  return matchingPrice;
}

export async function createManagedCheckoutSession(
  params: CreateManagedCheckoutSessionParams
) {
  const {
    allowPromotionCodes = true,
    cancelUrl,
    checkoutLocale = 'auto',
    email,
    lookupKey,
    mode = 'subscription',
    planSlug,
    priceId,
    successUrl,
    trialDays,
    userId,
  } = params;

  const price = await resolveCheckoutPrice({
    checkoutLocale,
    lookupKey,
    planSlug,
    priceId,
  });

  const customerId = await getOrCreateStripeCustomerId({ email, userId });

  return stripe.checkout.sessions.create({
    mode,
    customer: customerId,
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: allowPromotionCodes,
    locale: checkoutLocale,
    client_reference_id: userId,
    metadata: { clerkUserId: userId },
    success_url: successUrl,
    cancel_url: cancelUrl,
    ...(mode === 'subscription'
      ? {
          subscription_data: {
            metadata: { clerkUserId: userId },
            ...(trialDays && trialDays > 0
              ? { trial_period_days: Math.floor(trialDays) }
              : {}),
          },
        }
      : {}),
  });
}
