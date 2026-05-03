import {
  BillingStatusBadge,
  btnDanger,
  btnGhost,
  btnMagic,
  btnPrimary,
  cardBase,
  cardPadding,
  statCard,
  subtlePanel,
  type BillingTranslator,
} from '@/components/billing/billing-shared';
import {
  TrackedBillingButton,
  TrackedBillingLink,
} from '@/components/billing/BillingTrackingActions';

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
  const localePriceLookupKey =
    locale === 'fr' ? 'magic_monthly_eur' : 'magic_monthly_usd';

  const planSummary = !hasSub
    ? inactiveTitle
    : hidePlanDetails
      ? isCancelScheduled
        ? t('status.closurePlanned')
        : inactiveTitle
      : `${planLabel} - ${formatCurrency(amount || 0, currency)} / ${intervalLabel}`;

  const statusHint = !hasSub
    ? t('subscription.noPlanHint')
    : isCancelScheduled
      ? t('subscription.cancelAtPeriodEndHint')
      : isCanceled
        ? t('subscription.closedHint')
        : t('subscription.activeHint');

  return (
    <section className="space-y-5">
      {showCountdown ? (
        <div className={`${subtlePanel} max-w-3xl p-4 md:p-5`}>
          <div className="flex items-start gap-4">
            <div className="mt-1 h-11 w-2 rounded-full bg-gradient-to-b from-primary to-[#d400ff]" />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-black/45">
                {countdownLabel}
              </div>
              <div className="mt-1 text-xl font-semibold leading-tight text-black">
                {countdownMainText}
              </div>
              {countdownUntilText ? (
                <div className="mt-1 text-sm text-black/55">{countdownUntilText}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[#d400ff]"
              style={{ width: `${countdownProgressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <section className={`${cardBase} ${cardPadding}`}>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.2em] text-black/45">
              {t('subscription.sectionLabel')}
            </div>
            <div className="max-w-2xl text-2xl font-semibold leading-tight text-black md:text-3xl">
              {planSummary}
            </div>
            <p className="max-w-2xl text-sm text-black/65">{statusHint}</p>
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {startedOn ? (
            <SummaryCard
              label={t('subscription.subscriptionLabel')}
              value={startedOn}
            />
          ) : null}

          <SummaryCard label={nextPaymentLabel} value={nextPaymentValue} />

          {isCanceled && validUntilLabel ? (
            <SummaryCard label={validityLabel} value={validUntilLabel} />
          ) : null}

          {isCanceled && endedOnLabel ? (
            <SummaryCard label={endedLabel} value={endedOnLabel} />
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className={`${subtlePanel} p-5`}>
            <div className="text-sm font-semibold text-black">
              {t('subscription.whatsIncludedTitle')}
            </div>
            <p className="mt-2 text-sm leading-6 text-black/65">
              {!hasSub
                ? t('subscription.noPlanBody')
                : isCancelScheduled
                  ? t('subscription.cancelAtPeriodEndBody')
                  : isCanceled
                    ? t('subscription.closedBody')
                    : t('subscription.activeBody')}
            </p>
          </div>

          <aside className={`${subtlePanel} p-5`}>
            <div className="text-sm font-semibold text-black">
              {t('subscription.actionsTitle')}
            </div>
            <p className="mt-2 text-sm text-black/60">
              {t('subscription.actionsHint')}
            </p>

                <div className="mt-4 flex flex-col gap-3">
                  {!hasSub ? (
                    <>
                  <form action="/api/stripe/checkout" method="POST">
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
                    <TrackedBillingButton
                      className={`${btnMagic} w-full`}
                      tracking={{
                        buttonKey: 'billing_subscribe_now',
                        buttonLabel: locale === 'en' ? 'Subscribe now' : "S'abonner maintenant",
                        buttonContext: 'billing_subscription',
                        targetHref: '/api/stripe/checkout',
                        locale,
                        metadata: {
                          priceLookupKey: defaultPriceLookupKey,
                        },
                      }}
                    >
                      {locale === 'en' ? 'Subscribe now' : "S'abonner maintenant"}
                    </TrackedBillingButton>
                  </form>

                      <TrackedBillingLink
                        href={`/${locale}/plans?from=billing`}
                        tracking={{
                          buttonKey: 'billing_compare_plans',
                          buttonLabel: t('actions.comparePlans'),
                          buttonContext: 'billing_subscription',
                          targetHref: `/${locale}/plans?from=billing`,
                          locale,
                        }}
                        className={`${btnGhost} w-full`}
                      >
                        {t('actions.comparePlans')}
                      </TrackedBillingLink>

                      {isInDbTrialWindow ? (
                        <p className="text-xs leading-5 text-black/55">
                          {t('subscription.subscribeAfterTrialHint')}
                        </p>
                      ) : null}
                    </>
                  ) : (
                <>
                  {showManageSubscription ? (
                    <form action="/api/stripe/portal" method="POST">
                      <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                      <input
                        type="hidden"
                        name="portalLocale"
                        value={locale === 'fr' ? 'fr' : 'en'}
                      />
                      <TrackedBillingButton
                        type="submit"
                        className={`${btnPrimary} w-full`}
                        aria-label={t('actions.manageSubscription')}
                        tracking={{
                          buttonKey: 'billing_manage_subscription',
                          buttonLabel: t('actions.manageSubscription'),
                          buttonContext: 'billing_subscription',
                          targetHref: '/api/stripe/portal',
                          locale,
                        }}
                      >
                        {t('actions.manageSubscription')}
                      </TrackedBillingButton>
                    </form>
                  ) : null}

                  {showCancelResumeButtons ? (
                    isCancelScheduled ? (
                      <form action="/api/stripe/subscription/resume" method="POST">
                        <input type="hidden" name="subscriptionId" value={subId} />
                        <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                        <TrackedBillingButton
                          className={`${btnGhost} w-full`}
                          tracking={{
                            buttonKey: 'billing_resume_subscription',
                            buttonLabel: t('actions.cancelClosure'),
                            buttonContext: 'billing_subscription',
                            targetHref: '/api/stripe/subscription/resume',
                            locale,
                          }}
                        >
                          {t('actions.cancelClosure')}
                        </TrackedBillingButton>
                      </form>
                    ) : (
                      <form action="/api/stripe/subscription/cancel" method="POST">
                        <input type="hidden" name="subscriptionId" value={subId} />
                        <input type="hidden" name="returnUrl" value={manageReturnUrl} />
                        <TrackedBillingButton
                          className={`${btnDanger} w-full`}
                          tracking={{
                            buttonKey: 'billing_schedule_subscription_closure',
                            buttonLabel: t('actions.scheduleClosure'),
                            buttonContext: 'billing_subscription',
                            targetHref: '/api/stripe/subscription/cancel',
                            locale,
                          }}
                        >
                          {t('actions.scheduleClosure')}
                        </TrackedBillingButton>
                      </form>
                    )
                  ) : null}

                  {!isCancelScheduled && !isCanceled && !isCurrentMagic ? (
                    <>
                      <form action="/api/stripe/checkout" method="POST">
                        <input
                          type="hidden"
                          name="checkoutLocale"
                          value={locale === 'fr' ? 'fr' : 'en'}
                        />
                        <input
                          type="hidden"
                          name="priceLookupKey"
                          value={localePriceLookupKey}
                        />
                        <input type="hidden" name="mode" value="subscription" />
                        <input type="hidden" name="successUrl" value={successUrl} />
                        <input type="hidden" name="cancelUrl" value={cancelUrl} />
                        <TrackedBillingButton
                          className={`${btnMagic} w-full`}
                          aria-label={t('actions.upgradeMagic')}
                          tracking={{
                            buttonKey: 'billing_upgrade_magic',
                            buttonLabel: t('actions.upgradeMagic'),
                            buttonContext: 'billing_subscription',
                            targetHref: '/api/stripe/checkout',
                            locale,
                            metadata: {
                              priceLookupKey: localePriceLookupKey,
                            },
                          }}
                        >
                          {t('actions.upgradeMagic')}
                        </TrackedBillingButton>
                      </form>

                      <TrackedBillingLink
                        href={`/${locale}/plans?from=billing`}
                        tracking={{
                          buttonKey: 'billing_compare_plans',
                          buttonLabel: t('actions.comparePlans'),
                          buttonContext: 'billing_subscription_upgrade',
                          targetHref: `/${locale}/plans?from=billing`,
                          locale,
                        }}
                        className={`${btnGhost} w-full`}
                      >
                        {t('actions.comparePlans')}
                      </TrackedBillingLink>
                    </>
                  ) : null}
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </section>
  );
}
