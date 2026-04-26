export const runtime = 'nodejs';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BillingFeedbackToast } from '@/components/billing/BillingFeedbackToast';
import { BillingInvoicesSection } from '@/components/billing/BillingInvoicesSection';
import { BillingSubscriptionSection } from '@/components/billing/BillingSubscriptionSection';
import {
  btnMagic,
  cardBase,
  cardPadding,
  statCard,
  subtlePanel,
} from '@/components/billing/billing-shared';
import {
  createBillingTranslator,
  formatBillingCurrency,
  getBillingPageData,
} from '@/lib/server/services/billing-page-service';
import type { Locale } from '@/src/lib/i18n';
import { getMessages } from '@/src/i18n/getMessages';

type BillingSearchParams = {
  canceled?: string | string[];
  error?: string | string[];
  session_id?: string | string[];
  success?: string | string[];
};

function firstQueryValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className={statCard}>
      <div className="text-[11px] uppercase tracking-[0.18em] text-black/45">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold leading-tight text-black">
        {value}
      </div>
    </article>
  );
}

export default async function BillingPage({
  searchParams,
  params,
}: {
  searchParams?: Promise<BillingSearchParams>;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale = 'en' } = await params;
  const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';
  const allMessages = await getMessages(locale);
  const t = createBillingTranslator(allMessages.billing);

  const resolvedSearchParams = (await searchParams) || {};
  const sessionId = firstQueryValue(resolvedSearchParams.session_id);
  const errorCode = firstQueryValue(resolvedSearchParams.error);
  const canceled = firstQueryValue(resolvedSearchParams.canceled);
  const success = firstQueryValue(resolvedSearchParams.success);

  const feedbackTone = errorCode
    ? 'error'
    : canceled === '1'
      ? 'warning'
      : success === '1'
        ? 'success'
        : null;

  const feedbackMessage = (() => {
    if (errorCode === 'missing_subscription') return t('feedback.missingSubscription');
    if (errorCode === 'missing_customer') return t('feedback.missingCustomer');
    if (errorCode === 'forbidden_subscription')
      return t('feedback.forbiddenSubscription');
    if (errorCode === 'cancel_failed') return t('feedback.cancelFailed');
    if (errorCode === 'resume_failed') return t('feedback.resumeFailed');
    if (errorCode === 'portal_unavailable') return t('feedback.portalUnavailable');
    if (errorCode === 'invalid_customer') return t('feedback.invalidCustomer');
    if (errorCode === 'portal_failed') return t('feedback.portalFailed');
    if (canceled === '1') return t('feedback.canceled');
    if (success === '1') return t('feedback.success');
    return null;
  })();

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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(249,255,198,0.95)_48%,_rgba(244,248,190,1)_100%)] px-4 py-12 md:py-20">
        <BillingFeedbackToast message={feedbackMessage} tone={feedbackTone} />
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <section className={`${cardBase} ${cardPadding}`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="space-y-4">
                <div className="text-xs uppercase tracking-[0.2em] text-black/45">
                  {t('overview.eyebrow')}
                </div>
                <div className="max-w-2xl text-3xl font-semibold leading-tight text-black md:text-4xl">
                  {t('header.title')}
                </div>
                <p className="max-w-2xl text-sm leading-6 text-black/68">
                  {t('noCustomer.description')}
                </p>
                <div className={`${subtlePanel} max-w-2xl p-4`}>
                  <div className="text-sm font-semibold text-black">
                    {t('overview.trialLabel')}
                  </div>
                  <div className="mt-2 text-sm leading-6 text-black/68">
                    {data.trialText}
                  </div>
                </div>
              </div>

              <aside className={`${subtlePanel} p-5`}>
                <div className="text-sm font-semibold text-black">
                  {t('noCustomer.actionsTitle')}
                </div>
                <p className="mt-2 text-sm text-black/60">
                  {t('noCustomer.actionsHint')}
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <Link href={`/${locale}/plans?from=billing`} className={btnMagic}>
                    {t('actions.comparePlans')}
                  </Link>
                </div>

                {data.showSubscribeCTA ? (
                  <p className="mt-4 text-xs leading-5 text-black/55">
                    {t('subscription.subscribeAfterTrialHint')}
                  </p>
                ) : null}

                {!data.showSubscribeCTA ? (
                  <p className="mt-4 text-xs leading-5 text-black/55">
                    {t('noCustomer.ctaHiddenHint')}
                  </p>
                ) : null}
              </aside>
            </div>
          </section>

        </div>
      </main>
    );
  }

  const formatCurrency = (amountInCents: number, currencyCode: string) =>
    formatBillingCurrency(amountInCents, currencyCode, localeTag);

  const latestInvoice = data.invoices.data[0];
  const latestInvoiceValue = latestInvoice
    ? formatCurrency(
        latestInvoice.total || 0,
        latestInvoice.currency?.toUpperCase() || 'EUR'
      )
    : t('overview.latestInvoiceEmpty');

  const nextStepValue =
    data.showCountdown && data.countdownMainText
      ? data.countdownMainText
      : data.nextPaymentValue;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(249,255,198,0.95)_48%,_rgba(244,248,190,1)_100%)] px-4 py-12 md:py-20">
      <BillingFeedbackToast message={feedbackMessage} tone={feedbackTone} />
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className={`${cardBase} ${cardPadding}`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-[0.2em] text-black/45">
                {t('overview.eyebrow')}
              </div>
              <div className="max-w-3xl text-3xl font-semibold leading-tight text-black md:text-4xl">
                {t('header.title')}
              </div>
              <p className="max-w-3xl text-sm leading-6 text-black/68">
                {t('header.subtitle')}
              </p>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label={t('overview.planLabel')} value={data.planLabel} />
                <SummaryCard
                  label={t('overview.statusLabel')}
                  value={t(`status.${data.isCanceled ? 'closed' : data.isCancelScheduled ? 'closurePlanned' : data.status === 'active' ? 'active' : data.status === 'trialing' ? 'trialing' : data.status === 'past_due' || data.status === 'unpaid' ? 'paymentPending' : 'accessUntil'}`)}
                />
                <SummaryCard
                  label={t('overview.nextStepLabel')}
                  value={nextStepValue}
                />
                <SummaryCard
                  label={t('overview.latestInvoiceLabel')}
                  value={latestInvoiceValue}
                />
              </div>
            </div>

            <aside className={`${subtlePanel} p-5`}>
              <div className="text-sm font-semibold text-black">
                {t('overview.helpTitle')}
              </div>
              <p className="mt-2 text-sm leading-6 text-black/60">
                {t('overview.helpBody')}
              </p>
              <div className="mt-4 text-sm text-black/75">
                {t('overview.documentsLabel')}{' '}
                <span className="font-semibold text-black">
                  {t('invoices.count', { count: data.invoices.data.length })}
                </span>
              </div>
            </aside>
          </div>
        </section>

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
