import Stripe from 'stripe';

import { stripe } from '@/lib/stripe';
import { devLogger } from '@/lib/shared/dev-logger';
import {
  computeProgressPct,
  makeDaysLeftText,
  makeUntilText,
  mapPlanName,
  type BillingCustomerState,
  type BillingNoCustomerState,
} from '@/lib/server/services/billing-page-shared';
import type { BillingTranslator } from '@/components/billing/billing-shared';
import type { Locale } from '@/src/lib/i18n';

type BuildNoCustomerStateParams = {
  isInDbTrialWindow: boolean;
  locale: Locale;
  t: BillingTranslator;
  trialEndDb: Date;
  trialEndDbLabel: string;
};

type BuildCustomerStateParams = {
  cancelUrl: string;
  customerId: string;
  isInDbTrialWindow: boolean;
  locale: Locale;
  localeTag: string;
  manageReturnUrl: string;
  successUrl: string;
  t: BillingTranslator;
  trialEndDb: Date;
  trialEndDbLabel: string;
};

async function loadCurrentSubscription(customerId: string) {
  let sub: Stripe.Subscription | undefined;

  try {
    const list = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });

    const priority: Stripe.Subscription.Status[] = [
      'active',
      'trialing',
      'past_due',
      'unpaid',
      'incomplete',
      'incomplete_expired',
      'paused',
      'canceled',
    ];

    const picked = list.data
      .slice()
      .sort((a, b) => {
        const pa = priority.indexOf(a.status);
        const pb = priority.indexOf(b.status);
        return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
      })[0];

    if (picked?.id) {
      sub = await stripe.subscriptions.retrieve(picked.id, {
        expand: ['items.data.price'],
      });
    }
  } catch {
    sub = undefined;
  }

  return sub;
}

export function buildNoCustomerState(
  params: BuildNoCustomerStateParams,
): BillingNoCustomerState {
  const { isInDbTrialWindow, locale, t, trialEndDb, trialEndDbLabel } = params;
  const dayMs = 1000 * 60 * 60 * 24;
  const showSubscribeBeforeDays = 7;
  const msLeft = trialEndDb.getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / dayMs);
  const showSubscribeCTA =
    !isInDbTrialWindow || daysLeft <= showSubscribeBeforeDays;

  let trialText = '';
  if (isInDbTrialWindow) {
    trialText =
      daysLeft <= showSubscribeBeforeDays
        ? t('noCustomer.trialEndsSoon', {
            date: trialEndDbLabel,
            days: daysLeft,
          })
        : t('noCustomer.trialActiveUntil', { date: trialEndDbLabel });
  } else {
    trialText = t('noCustomer.trialEnded', { date: trialEndDbLabel });
  }

  return {
    kind: 'no-customer',
    showSubscribeCTA,
    trialText,
  };
}

export async function buildCustomerState(
  params: BuildCustomerStateParams,
): Promise<BillingCustomerState> {
  const {
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
  } = params;

  const dayMs = 1000 * 60 * 60 * 24;
  const sub = await loadCurrentSubscription(customerId);
  const hasSub = Boolean(sub?.id);
  const subId = sub?.id;
  const status = sub?.status ?? 'none';
  const showTrialWindow = isInDbTrialWindow && (status === 'trialing' || !hasSub);
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });

  const rawCancelScheduled = Boolean((sub as any)?.cancel_at_period_end);
  const isCancelScheduled = rawCancelScheduled && !showTrialWindow;
  const isCanceled =
    !hasSub || status === 'canceled' || Boolean((sub as any)?.ended_at);

  let planLabel = '-';
  let amount = 0;
  let currency = 'EUR';
  let interval: 'day' | 'week' | 'month' | 'year' | 'unknown' = 'month';

  const price = (sub?.items?.data?.[0]?.price ?? null) as Stripe.Price | null;
  if (price) {
    amount = price.unit_amount ?? 0;
    currency = (price.currency || 'eur').toUpperCase();
    interval = price.recurring?.interval ?? 'month';

    const rawPlan = price.nickname || price.lookup_key || '-';
    planLabel = mapPlanName(rawPlan);

    if (planLabel === rawPlan && planLabel === '-' && price.product) {
      const productId =
        typeof price.product === 'string' ? price.product : price.product.id;
      try {
        const product = await stripe.products.retrieve(productId);
        planLabel = product.name || planLabel;
      } catch {
        // ignore
      }
    }
  }

  const currentPlanRaw = (price?.lookup_key ?? price?.nickname ?? '') as string;
  const currentPlan = String(currentPlanRaw).toLowerCase();
  const isCurrentMagic = currentPlan.startsWith('magic');
  const intervalLabel =
    interval === 'year'
      ? t('subscription.interval.year')
      : t('subscription.interval.month');

  const currentPeriodEndSec = (sub as any)?.current_period_end as
    | number
    | undefined;
  const currentPeriodStartSec = (sub as any)?.current_period_start as
    | number
    | undefined;
  const stripePeriodStartMs = currentPeriodStartSec
    ? currentPeriodStartSec * 1000
    : null;

  let previewInvoice: Stripe.Invoice | null = null;
  if (subId) {
    try {
      previewInvoice = await stripe.invoices.createPreview({
        customer: customerId,
        subscription: subId,
      });
    } catch {
      previewInvoice = null;
    }
  }

  const periodEndFromPreview = (() => {
    const value = (previewInvoice as any)?.period_end;
    return typeof value === 'number' ? value : null;
  })();
  const lineEndForSub =
    previewInvoice?.lines?.data?.find((line: any) => line.subscription === subId)
      ?.period?.end ?? null;
  const lineEndFirst = previewInvoice?.lines?.data?.[0]?.period?.end ?? null;
  const nextPaymentSec: number | null =
    currentPeriodEndSec ??
    previewInvoice?.next_payment_attempt ??
    periodEndFromPreview ??
    lineEndForSub ??
    lineEndFirst ??
    null;

  const stripeNextPaymentLabel = nextPaymentSec
    ? new Date(nextPaymentSec * 1000).toLocaleDateString(localeTag)
    : '';
  const nextPaymentLabel =
    locale === 'en' ? 'Next payment' : 'Prochain paiement';
  const noNextPaymentText =
    locale === 'en' ? 'No payment scheduled' : 'Aucun paiement prévu';

  let nextPaymentValue = stripeNextPaymentLabel || noNextPaymentText;
  if (isCancelScheduled || isCanceled) {
    nextPaymentValue = noNextPaymentText;
  }

  const endedAtSec =
    (sub as any)?.ended_at ??
    (sub as any)?.canceled_at ??
    currentPeriodEndSec ??
    undefined;
  const endedOnLabel = endedAtSec
    ? new Date(endedAtSec * 1000).toLocaleDateString(localeTag)
    : '';

  const inactiveTitle =
    locale === 'en' ? 'No active subscription' : 'Aucun abonnement actif';
  const endedLabel = locale === 'en' ? 'Ended on' : 'Terminé le';
  const defaultPriceLookupKey =
    locale === 'en' ? 'magic_monthly_usd' : 'magic_monthly_eur';
  const hidePlanDetails = isCancelScheduled || isCanceled;
  const validityLabel =
    locale === 'en' ? 'Access valid until' : "Accès valable jusqu'au";
  const validityEndedMain = locale === 'en' ? 'Access ended' : 'Accès terminé';

  const cancelAtSec = (() => {
    const value = (sub as any)?.cancel_at;
    return typeof value === 'number' ? value : null;
  })();
  const accessEndSec: number | null =
    cancelAtSec ?? currentPeriodEndSec ?? nextPaymentSec ?? null;
  const accessEndLabel =
    accessEndSec != null
      ? new Date(accessEndSec * 1000).toLocaleDateString(localeTag)
      : '';
  const validUntilSec: number | null =
    (isCanceled ? endedAtSec ?? currentPeriodEndSec ?? nextPaymentSec : null) ??
    null;
  const validUntilLabel =
    validUntilSec != null
      ? new Date(validUntilSec * 1000).toLocaleDateString(localeTag)
      : '';

  devLogger.log('[BILLING DEBUG]', {
    locale,
    isInDbTrialWindow,
    showTrialWindow,
    hasSub,
    subId,
    status,
    rawCancelScheduled,
    isCancelScheduled,
    isCanceled,
    currentPeriodStartSec,
    currentPeriodEndSec,
    cancelAtSec,
    nextPaymentSec,
    accessEndSec,
    endedAtSec,
    preview_next_payment_attempt: previewInvoice?.next_payment_attempt ?? null,
    preview_period_end: periodEndFromPreview,
    preview_line_sub_end: lineEndForSub,
    preview_line0_end: lineEndFirst,
  });

  let showCountdown = false;
  let countdownLabel = '';
  let countdownMainText = '';
  let countdownUntilLabel = '';
  let countdownProgressPct = 0;

  if (showTrialWindow) {
    showCountdown = true;
    countdownLabel = t('subscription.trialEndLabel');
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEndDb.getTime() - Date.now()) / dayMs),
    );
    countdownMainText = makeDaysLeftText(locale, daysLeft);
    countdownUntilLabel = trialEndDbLabel;
    countdownProgressPct = computeProgressPct(
      trialEndDb.getTime() - 30 * dayMs,
      trialEndDb.getTime(),
    );
  } else if (isCancelScheduled) {
    showCountdown = true;
    countdownLabel = locale === 'en' ? 'Access ends in' : 'Fin d acces dans';
    countdownLabel = locale === 'en' ? 'Access ends in' : "Fin d'accès dans";

    const endMs = accessEndSec ? accessEndSec * 1000 : null;
    if (endMs && accessEndLabel) {
      const daysLeft = Math.max(0, Math.ceil((endMs - Date.now()) / dayMs));
      countdownMainText = makeDaysLeftText(locale, daysLeft);
      countdownUntilLabel = accessEndLabel;
      countdownProgressPct = computeProgressPct(stripePeriodStartMs, endMs);
    } else {
      countdownMainText =
        locale === 'en' ? 'End date unavailable' : 'Date de fin indisponible';
      countdownUntilLabel = '';
      countdownProgressPct = 0;
    }
  } else if (hasSub && isCanceled && validUntilSec && validUntilLabel) {
    const validUntilMs = validUntilSec * 1000;
    const daysLeft = Math.max(0, Math.ceil((validUntilMs - Date.now()) / dayMs));

    showCountdown = true;
    countdownLabel = validityLabel;
    countdownMainText =
      validUntilMs > Date.now()
        ? makeDaysLeftText(locale, daysLeft)
        : validityEndedMain;
    countdownUntilLabel = validUntilLabel;
    countdownProgressPct = computeProgressPct(stripePeriodStartMs, validUntilMs);
  }

  devLogger.log('[BILLING BANNER]', {
    showCountdown,
    countdownLabel,
    countdownUntilLabel,
    countdownMainText,
    countdownProgressPct,
  });

  const startedOn = (sub as any)?.start_date
    ? new Date((sub as any).start_date * 1000).toLocaleDateString(localeTag)
    : '';

  return {
    kind: 'customer',
    amount,
    cancelUrl,
    countdownLabel,
    countdownMainText,
    countdownProgressPct,
    countdownUntilText: makeUntilText(locale, countdownUntilLabel),
    currency,
    defaultPriceLookupKey,
    endedLabel,
    endedOnLabel,
    hasSub,
    hidePlanDetails,
    inactiveTitle,
    intervalLabel,
    invoices,
    isCancelScheduled,
    isCanceled,
    isCurrentMagic,
    isInDbTrialWindow: showTrialWindow,
    manageReturnUrl,
    nextPaymentLabel,
    nextPaymentValue,
    planLabel,
    showCancelResumeButtons: hasSub && !showTrialWindow && !isCanceled,
    showCountdown,
    showManageSubscription: hasSub,
    startedOn,
    status,
    subId,
    successUrl,
    validUntilLabel,
    validityLabel,
  };
}
