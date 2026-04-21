import Link from 'next/link';

import {
  BillingStatusBadge,
  btnDanger,
  btnGhost,
  btnMagic,
  btnPrimary,
  cardBase,
  cardPadding,
  type BillingTranslator,
} from '@/components/billing/billing-shared';

type BillingSubscriptionSectionProps = {
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
  formatCurrency: (amount: number, currency: string) => string;
  hasSub: boolean;
  hidePlanDetails: boolean;
  inactiveTitle: string;
  intervalLabel: string;
  isCancelScheduled: boolean;
  isCanceled: boolean;
  isCurrentMagic: boolean;
  isInDbTrialWindow: boolean;
  locale: string;
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
  t: BillingTranslator;
  validUntilLabel: string;
  validityLabel: string;
};

export function BillingSubscriptionSection({
  amount,
  cancelUrl,
  countdownLabel,
  countdownMainText,
  countdownProgressPct,
  countdownUntilText,
  currency,
  defaultPriceLookupKey,
  endedLabel,
  endedOnLabel,
  formatCurrency,
  hasSub,
  hidePlanDetails,
  inactiveTitle,
  intervalLabel,
  isCancelScheduled,
  isCanceled,
  isCurrentMagic,
  isInDbTrialWindow,
  locale,
  manageReturnUrl,
  nextPaymentLabel,
  nextPaymentValue,
  planLabel,
  showCancelResumeButtons,
  showCountdown,
  showManageSubscription,
  startedOn,
  status,
  subId,
  successUrl,
  t,
  validUntilLabel,
  validityLabel,
}: BillingSubscriptionSectionProps) {
  return (
    <>
      {showCountdown ? (
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-primary to-[#d400ff]" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-black/60">
                  {countdownLabel}
                </div>
                <div className="text-lg font-semibold leading-tight text-black">
                  {countdownMainText}
                </div>
                {countdownUntilText ? (
                  <div className="text-xs text-black/50">{countdownUntilText}</div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#d400ff]"
                style={{ width: `${countdownProgressPct}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <section className={`${cardBase} ${cardPadding}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-black/50">
              {t('subscription.sectionLabel')}
            </div>

            {!hasSub ? (
              <div className="text-xl font-semibold text-black">{inactiveTitle}</div>
            ) : hidePlanDetails ? (
              <div className="text-xl font-semibold text-black">
                {isCancelScheduled ? t('status.closurePlanned') : inactiveTitle}
              </div>
            ) : (
              <div className="text-xl font-semibold text-black">
                {planLabel} - {formatCurrency(amount || 0, currency)} / {intervalLabel}
              </div>
            )}
          </div>

          <div className="md:text-right">
            <BillingStatusBadge
              isCanceled={isCanceled}
              isCancelScheduled={isCancelScheduled}
              isInDbTrialWindow={isInDbTrialWindow}
              status={status}
              t={t}
            />
          </div>
        </div>

        <div className="my-6 h-px w-full bg-black/10" />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <dl className="grid grid-cols-1 gap-4 md:col-span-2 sm:grid-cols-2">
            {hasSub ? (
              <>
                {startedOn ? (
                  <div className="space-y-1">
                    <dt className="text-sm text-black/60">
                      {t('subscription.subscriptionLabel')}
                    </dt>
                    <dd className="text-base font-medium text-black">{startedOn}</dd>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <dt className="text-sm text-black/60">{nextPaymentLabel}</dt>
                  <dd className="text-base font-medium text-black">
                    {nextPaymentValue}
                  </dd>
                </div>

                {isCanceled && validUntilLabel ? (
                  <div className="space-y-1">
                    <dt className="text-sm text-black/60">{validityLabel}</dt>
                    <dd className="text-base font-medium text-black">
                      {validUntilLabel}
                    </dd>
                  </div>
                ) : null}

                {isCanceled && endedOnLabel ? (
                  <div className="space-y-1">
                    <dt className="text-sm text-black/60">{endedLabel}</dt>
                    <dd className="text-base font-medium text-black">
                      {endedOnLabel}
                    </dd>
                  </div>
                ) : null}
              </>
            ) : null}
          </dl>

          <div className="flex flex-col items-stretch gap-3 md:items-end">
            {!hasSub ? (
              <>
                <form
                  action="/api/stripe/checkout"
                  method="POST"
                  className="w-full md:w-auto"
                >
                  <input
                    type="hidden"
                    name="checkoutLocale"
                    value={locale === 'fr' ? 'fr' : 'en'}
                  />
                  <input
                    type="hidden"
                    name="priceLookupKey"
                    value={defaultPriceLookupKey}
                  />
                  <input type="hidden" name="mode" value="subscription" />
                  <input type="hidden" name="successUrl" value={successUrl} />
                  <input type="hidden" name="cancelUrl" value={cancelUrl} />
                  <button className={btnMagic}>
                    {locale === 'en' ? 'Subscribe' : "S’abonner"}
                  </button>
                </form>

                <Link href={`/${locale}/plans?from=billing`} className={btnGhost}>
                  {t('actions.comparePlans')}
                </Link>
              </>
            ) : (
              <>
                {showManageSubscription ? (
                  <form
                    action="/api/stripe/portal"
                    method="POST"
                    className="w-full md:w-auto"
                  >
                    <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                    <input
                      type="hidden"
                      name="portalLocale"
                      value={locale === 'fr' ? 'fr' : 'en'}
                    />
                    <button
                      type="submit"
                      className={btnPrimary}
                      aria-label={t('actions.manageSubscription')}
                    >
                      {t('actions.manageSubscription')}
                    </button>
                  </form>
                ) : null}

                {showCancelResumeButtons ? (
                  isCancelScheduled ? (
                    <form
                      action="/api/stripe/subscription/resume"
                      method="POST"
                      className="w-full md:w-auto"
                    >
                      <input type="hidden" name="subscriptionId" value={subId} />
                      <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                      <button className={btnGhost}>{t('actions.cancelClosure')}</button>
                    </form>
                  ) : (
                    <form
                      action="/api/stripe/subscription/cancel"
                      method="POST"
                      className="w-full md:w-auto"
                    >
                      <input type="hidden" name="subscriptionId" value={subId} />
                      <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                      <button className={btnDanger}>
                        {t('actions.scheduleClosure')}
                      </button>
                    </form>
                  )
                ) : null}

                {!isCancelScheduled && !isCanceled && !isCurrentMagic ? (
                  <div className="mt-2 flex flex-wrap gap-2 md:justify-end" role="group">
                    <form action="/api/stripe/checkout" method="POST">
                      <input
                        type="hidden"
                        name="checkoutLocale"
                        value={locale === 'fr' ? 'fr' : 'en'}
                      />
                      <input
                        type="hidden"
                        name="priceLookupKey"
                        value="magic_monthly_eur"
                      />
                      <input type="hidden" name="mode" value="subscription" />
                      <input type="hidden" name="successUrl" value={successUrl} />
                      <input type="hidden" name="cancelUrl" value={cancelUrl} />
                      <button className={btnMagic} aria-label={t('actions.upgradeMagic')}>
                        {t('actions.upgradeMagic')}
                      </button>
                    </form>

                    <Link href={`/${locale}/plans?from=billing`} className={btnGhost}>
                      {t('actions.comparePlans')}
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
