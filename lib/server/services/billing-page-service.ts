import { auth, clerkClient as getClerkClient } from '@clerk/nextjs/server';

import type { BillingTranslator } from '@/components/billing/billing-shared';
import { resolveStripeCustomerId } from '@/lib/server/stripe-customer';
import { loadBillingUserContext } from '@/lib/server/services/billing-page-repository';
import {
  buildCustomerState,
  buildNoCustomerState,
} from '@/lib/server/services/billing-page-stripe';
import {
  addOneMonth,
  createBillingTranslator,
  formatBillingCurrency,
  toDate,
  type BillingPageData,
} from '@/lib/server/services/billing-page-shared';
import type { Locale } from '@/src/lib/i18n';

export { createBillingTranslator, formatBillingCurrency };
export type { BillingPageData } from '@/lib/server/services/billing-page-shared';

export async function getBillingPageData(params: {
  locale: Locale;
  localeTag: string;
  sessionId?: string;
  t: BillingTranslator;
}): Promise<BillingPageData> {
  const { locale, localeTag, sessionId, t } = params;
  const { userId } = await auth();
  if (!userId) {
    return { kind: 'redirect', href: `/${locale}/sign-in` };
  }

  const context = await loadBillingUserContext(userId);
  if (!context) {
    return { kind: 'redirect', href: `/${locale}/sign-in` };
  }

  const { instructorCreatedAt, trialRow } = context;
  const trialStartDb = trialRow.trialStart
    ? toDate(trialRow.trialStart)
    : instructorCreatedAt;
  const trialEndDb = trialRow.trialEnd
    ? toDate(trialRow.trialEnd)
    : addOneMonth(trialStartDb);
  const trialEndDbLabel = trialEndDb.toLocaleDateString(localeTag);
  const isInDbTrialWindow =
    Boolean(trialRow.isInTrial) && Date.now() < trialEndDb.getTime();

  const clerk = await getClerkClient();
  let user: any;
  try {
    user = await clerk.users.getUser(userId);
  } catch {
    return { kind: 'redirect', href: `/${locale}/sign-in` };
  }

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices?canceled=1`;
  const manageReturnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/invoices`;
  const customerId = await resolveStripeCustomerId({
    userId,
    user,
    sessionId,
  });

  if (!customerId) {
    return buildNoCustomerState({
      isInDbTrialWindow,
      locale,
      t,
      trialEndDb,
      trialEndDbLabel,
    });
  }

  return buildCustomerState({
    cancelUrl,
    customerId,
    isInDbTrialWindow,
    locale,
    localeTag,
    manageReturnUrl,
    successUrl,
    t,
    trialEndDb,
    trialEndDbLabel,
  });
}
