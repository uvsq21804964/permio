export const runtime = 'nodejs';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BillingInvoicesSection } from '@/components/billing/BillingInvoicesSection';
import { BillingSubscriptionSection } from '@/components/billing/BillingSubscriptionSection';
import {
  btnMagic,
  cardBase,
  cardPadding,
} from '@/components/billing/billing-shared';
import {
  createBillingTranslator,
  formatBillingCurrency,
  getBillingPageData,
} from '@/lib/server/services/billing-page-service';
import type { Locale } from '@/src/lib/i18n';
import { getMessages } from '@/src/i18n/getMessages';

export default async function BillingPage({
  searchParams,
  params,
}: {
  searchParams?: Promise<{ session_id?: string | string[] }>;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale = 'en' } = await params;
  const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';
  const allMessages = await getMessages(locale);
  const t = createBillingTranslator(allMessages.billing);

  const resolvedSearchParams = (await searchParams) || {};
  const sessionId = Array.isArray(resolvedSearchParams.session_id)
    ? resolvedSearchParams.session_id[0]
    : resolvedSearchParams.session_id;

  const data = await getBillingPageData({
    locale,
    localeTag,
    sessionId,
    t,
  });

  if (data.kind === 'redirect') {
    redirect(data.href);
  }

  if (data.kind === 'no-customer') {
    return (
      <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <header className="break-words" style={{ hyphens: 'auto' }}>
            <h1 className="text-2xl font-semibold text-black md:text-3xl">
              {t('header.title')}
            </h1>
            <p className="mt-2 text-sm text-black/70">
              {t('noCustomer.description')}
            </p>
            <p className="mt-3 text-sm text-black/80">{data.trialText}</p>
          </header>

          <section className={`${cardBase} ${cardPadding}`}>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/${locale}/plans?from=billing`} className={btnMagic}>
                {t('actions.comparePlans')}
              </Link>
            </div>

            {!data.showSubscribeCTA ? (
              <p className="mt-3 text-xs text-black/60">
                {t('noCustomer.ctaHiddenHint')}
              </p>
            ) : null}
          </section>
        </div>
      </main>
    );
  }

  const formatCurrency = (amountInCents: number, currencyCode: string) =>
    formatBillingCurrency(amountInCents, currencyCode, localeTag);

  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-black md:text-3xl">
            {t('header.title')}
          </h1>
          <p className="text-sm text-black/70">{t('header.subtitle')}</p>
        </header>

        <BillingSubscriptionSection
          amount={data.amount}
          cancelUrl={data.cancelUrl}
          countdownLabel={data.countdownLabel}
          countdownMainText={data.countdownMainText}
          countdownProgressPct={data.countdownProgressPct}
          countdownUntilText={data.countdownUntilText}
          currency={data.currency}
          defaultPriceLookupKey={data.defaultPriceLookupKey}
          endedLabel={data.endedLabel}
          endedOnLabel={data.endedOnLabel}
          formatCurrency={formatCurrency}
          hasSub={data.hasSub}
          hidePlanDetails={data.hidePlanDetails}
          inactiveTitle={data.inactiveTitle}
          intervalLabel={data.intervalLabel}
          isCancelScheduled={data.isCancelScheduled}
          isCanceled={data.isCanceled}
          isCurrentMagic={data.isCurrentMagic}
          isInDbTrialWindow={data.isInDbTrialWindow}
          locale={locale}
          manageReturnUrl={data.manageReturnUrl}
          nextPaymentLabel={data.nextPaymentLabel}
          nextPaymentValue={data.nextPaymentValue}
          planLabel={data.planLabel}
          showCancelResumeButtons={data.showCancelResumeButtons}
          showCountdown={data.showCountdown}
          showManageSubscription={data.showManageSubscription}
          startedOn={data.startedOn}
          status={data.status}
          subId={data.subId}
          successUrl={data.successUrl}
          t={t}
          validUntilLabel={data.validUntilLabel}
          validityLabel={data.validityLabel}
        />

        <BillingInvoicesSection
          formatCurrency={formatCurrency}
          invoices={data.invoices}
          localeTag={localeTag}
          t={t}
        />

        <section className="text-xs text-black/60">
          {t('help.text')}{' '}
          <Link
            href={`/${locale}${t('help.contactLink')}`}
            className="underline underline-offset-4 hover:no-underline"
          >
            {t('help.contactLink')}
          </Link>
          .
        </section>
      </div>
    </main>
  );
}
