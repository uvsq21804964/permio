import type { BillingTranslator } from '@/components/billing/billing-shared';
import type { Locale } from '@/src/lib/i18n';
import Stripe from 'stripe';

export type DbMeRow = {
  role: string;
  agencyId: string;
  createdAt: string | Date;
};

export type DbInstructorRow = {
  createdAt: string | Date;
};

export type BillingRedirectState = {
  kind: 'redirect';
  href: string;
};

export type BillingNoCustomerState = {
  kind: 'no-customer';
  showSubscribeCTA: boolean;
  trialText: string;
};

export type BillingCustomerState = {
  kind: 'customer';
  amount: number;
  cancelUrl: string;
  countdownLabel: string;
  countdownMainText: string;
  countdownProgressPct: number;
  countdownUntilText: string;
  currency: string;
  defaultPriceLookupKey: string;
  endedLabel: string;
  endedOnLabel: string;
  hasSub: boolean;
  hidePlanDetails: boolean;
  inactiveTitle: string;
  intervalLabel: string;
  invoices: Stripe.ApiList<Stripe.Invoice>;
  isCancelScheduled: boolean;
  isCanceled: boolean;
  isCurrentMagic: boolean;
  isInDbTrialWindow: boolean;
  manageReturnUrl: string;
  nextPaymentLabel: string;
  nextPaymentValue: string;
  planLabel: string;
  showCancelResumeButtons: boolean;
  showCountdown: boolean;
  showManageSubscription: boolean;
  startedOn: string;
  status: string;
  subId?: string;
  successUrl: string;
  validUntilLabel: string;
  validityLabel: string;
};

export type BillingPageData =
  | BillingRedirectState
  | BillingNoCustomerState
  | BillingCustomerState;

export type BillingUserContext = {
  meDb: DbMeRow;
  instructorCreatedAt: Date;
  trialRow: any;
};

export function addOneMonth(date: Date) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + 1);
  return copy;
}

export function toDate(value: unknown): Date {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date(0);
}

export function mapPlanName(raw?: string | null) {
  if (!raw) return '-';
  const normalized = String(raw).toLowerCase();
  if (normalized.startsWith('starter')) return 'Starter';
  if (normalized.startsWith('pro')) return 'Pro';
  if (normalized.startsWith('magic')) return 'Full Magic';
  return raw;
}

export function formatBillingCurrency(
  cents: number,
  currency = 'eur',
  localeTag = 'fr-FR',
) {
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function getPrimaryEmail(user: any): string | undefined {
  const id = user?.primaryEmailAddressId;
  return user?.emailAddresses?.find((entry: any) => entry.id === id)?.emailAddress;
}

export function createBillingTranslator(dict: any): BillingTranslator {
  return (
    path: string,
    vars?: Record<string, string | number | null | undefined>,
  ): string => {
    const parts = path.split('.');
    let current: any = dict;
    for (const part of parts) current = current?.[part];

    let value = typeof current === 'string' ? current : path;
    if (vars) {
      for (const [key, entry] of Object.entries(vars)) {
        value = value.split(`{${key}}`).join(entry == null ? '' : String(entry));
      }
    }

    return value;
  };
}

export function makeDaysLeftText(locale: Locale, days: number) {
  if (locale === 'en') {
    return `${days} day${days > 1 ? 's' : ''} left`;
  }

  return `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}`;
}

export function makeUntilText(locale: Locale, dateLabel: string) {
  if (!dateLabel) return '';
  return locale === 'en' ? `Until ${dateLabel}` : `Jusqu'au ${dateLabel}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function computeProgressPct(startMs?: number | null, endMs?: number | null) {
  if (!startMs || !endMs || endMs <= startMs) return 0;
  const pct = ((Date.now() - startMs) / (endMs - startMs)) * 100;
  return Math.round(clamp(pct, 0, 100));
}
