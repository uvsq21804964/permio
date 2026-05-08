'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { trackButtonClick } from '@/lib/client/button-tracking';
import { useLocale, useTranslations } from 'next-intl';
import React, { useMemo } from 'react';
import { useMySubscriptionStatus } from '@/lib/client/hooks/useMySubscriptionStatus';

const poppins = { className: 'font-sans' };

type Currency = 'EUR' | 'USD';

type Plan = {
  id: string;
  title: string;
  prices: Record<Currency, number>;
  features: string[];
  highlighted?: boolean;
};

type Props = {
  withTrial: boolean;
};

function normalizeLang(locale: string): 'fr' | 'en' {
  const raw = (locale ?? '').toLowerCase();
  return raw.startsWith('fr') ? 'fr' : 'en';
}

function getCurrencyFromLang(lang: 'fr' | 'en'): Currency {
  return lang === 'fr' ? 'EUR' : 'USD';
}

function formatCurrency(amount: number, currency: Currency, lang: 'fr' | 'en') {
  const nfLocale = lang === 'fr' ? 'fr-FR' : 'en-US';

  if (!Number.isFinite(amount)) return currency === 'USD' ? '$—' : '—€';

  return new Intl.NumberFormat(nfLocale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Plans({ withTrial }: Props) {
  const t = useTranslations('plans');

  const locale = useLocale(); // ex: 'fr' | 'fr-FR' | 'en' | 'en-US'
  const lang = normalizeLang(locale); // ✅ 'fr' ou 'en'
  const currency = getCurrencyFromLang(lang);

  const { subscription, status } = useMySubscriptionStatus(!withTrial);

  const plans: readonly Plan[] = useMemo(
    () => [
      {
        id: 'full-magic', // id interne UI (pas Stripe)
        title: t('plans.plan.title'),
        prices: {
          EUR: Number(process.env.NEXT_PUBLIC_PRICE_EUR),
          USD: Number(process.env.NEXT_PUBLIC_PRICE_DOL),
        },
        features: [
          t('plans.plan.features.0'),
          t('plans.plan.features.1'),
          t('plans.plan.features.2'),
          t('plans.plan.features.3'),
          t('plans.plan.features.4'),
          t('plans.plan.features.5'),
        ],
        highlighted: true,
      },
    ],
    [t]
  );

  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${lang}/invoices?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${lang}/invoices?canceled=1`;

  const hideCheckoutButton =
    !withTrial &&
    subscription?.loggedIn === true &&
    subscription?.role === 'instructor' &&
    subscription.subscription_cancel_at_period_end !== true &&
    (subscription?.subscription_status === 'active' ||
      subscription?.subscription_status === 'trialing');
  const isCancellationScheduled =
    !withTrial &&
    subscription?.loggedIn === true &&
    subscription?.role === 'instructor' &&
    subscription.subscription_cancel_at_period_end === true &&
    (subscription.subscription_status === 'active' ||
      subscription.subscription_status === 'trialing');

  const waitingForSubscriptionCheck = !withTrial && status === 'loading';

  return (
    <main className="bg-[#f9ffc6]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <header className="text-center">
          <h2
            className={clsx(
              poppins.className,
              'font-display text-[clamp(26px,4.5vw,40px)] leading-tight tracking-tight',
              'text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]'
            )}
          >
            {t('plans.heading')}
          </h2>

          <p className="mt-2 text-sm text-black/70">{t('plans.subheading')}</p>

          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-[#d400ff]/30 bg-white/70 backdrop-blur p-4 text-sm text-black/80">
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]">
              {t('plans.banner.label')}
              {' · '}
            </span>
            {t('plans.banner.text')}
          </div>
        </header>

        <section className="mt-8 flex justify-center">
          {plans.map((plan) => {
            const isHighlighted = Boolean(plan.highlighted);

            return (
              <article
                key={plan.id}
                className={clsx(
                  'w-full max-w-sm',
                  'relative h-full flex flex-col rounded-2xl border p-5 sm:p-6',
                  'bg-white/85 backdrop-blur shadow-sm',
                  isHighlighted ? 'border-[#d400ff]/50' : 'border-black/10'
                )}
              >
                {isHighlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-[#d400ff] px-3 py-1 text-xs font-semibold text-white shadow">
                    {t('plans.badge')}
                  </span>
                )}

                <div className="flex-1">
                  <h3
                    className={clsx(poppins.className, 'font-display text-xl')}
                  >
                    {plan.title}
                  </h3>

                  <div className="mt-2 flex items-end gap-1">
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]">
                      {t('plans.priceDisplay')}
                    </span>
                    <span className="text-sm text-black/60">
                      {t('plans.priceSuffix')}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-black/50">
                    {t('plans.note')}
                  </p>

                  <p className="mt-2 text-sm font-medium text-black/75">
                    {t('plans.capNote')}
                  </p>

                  <ul className="mt-5 space-y-2 text-sm text-black/80">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-2 w-2 rounded-full bg-gradient-to-r from-primary to-[#d400ff]" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {waitingForSubscriptionCheck ? (
                  <div className="mt-6">
                    <Button
                      type="button"
                      disabled
                      className={clsx(
                        'w-full rounded-xl px-4 py-3 text-sm font-semibold shadow',
                        'opacity-60 cursor-not-allowed'
                      )}
                    >
                      {lang === 'en'
                        ? 'Checking subscription…'
                        : 'Vérification de l’abonnement…'}
                    </Button>
                  </div>
                ) : isCancellationScheduled ? (
                  <div className="mt-6 space-y-3">
                    <p className="text-center text-sm text-black/70">
                      {t('plans.cancellationScheduled')}
                    </p>
                    <Button asChild variant="outline" className="w-full rounded-xl">
                      <Link
                        href={`/${lang}/invoices`}
                        onClick={() => {
                          trackButtonClick({
                            buttonKey: 'plans_manage_scheduled_cancellation',
                            buttonLabel: t('plans.manageSubscription'),
                            buttonContext: 'pricing_page',
                            targetHref: `/${lang}/invoices`,
                            locale: lang,
                          });
                        }}
                      >
                        {t('plans.manageSubscription')}
                      </Link>
                    </Button>
                  </div>
                ) : hideCheckoutButton ? (
                  <p className="mt-6 text-center text-sm text-black/70">
                    {t('plans.alreadySubscribed')}
                  </p>
                ) : (
                  <>
                    <form
                      action={
                        withTrial ? `/${lang}/sign-up` : '/api/stripe/checkout'
                      }
                      method="POST"
                      className="mt-6"
                    >
                      {/* ✅ juste la langue normalisée */}
                      <input type="hidden" name="checkoutLocale" value={lang} />

                      {/* ✅ optional : si un jour tu ajoutes d'autres plans */}
                      <input
                        type="hidden"
                        name="planSlug"
                        value="magic_monthly"
                      />

                      <input type="hidden" name="mode" value="subscription" />
                      <input
                        type="hidden"
                        name="successUrl"
                        value={successUrl}
                      />
                      <input type="hidden" name="cancelUrl" value={cancelUrl} />
                      <input
                        type="hidden"
                        name="trialMode"
                        value={withTrial ? 'trial' : 'no_trial'}
                      />

                      <Button
                        type="submit"
                        onClick={() => {
                          trackButtonClick({
                            buttonKey: withTrial
                              ? 'plans_trial_sign_up'
                              : 'plans_checkout_submit',
                            buttonLabel: withTrial
                              ? t('plans.ctaPrimary')
                              : t('plans.ctaSecondary'),
                            buttonContext: withTrial ? 'home_pricing' : 'pricing_page',
                            targetHref: withTrial ? `/${lang}/sign-up` : '/api/stripe/checkout',
                            locale: lang,
                            metadata: {
                              planId: plan.id,
                              currency,
                              trialMode: withTrial ? 'trial' : 'no_trial',
                            },
                          });
                        }}
                        className={clsx(
                          'w-full rounded-xl px-4 py-3 text-sm font-semibold transition shadow',
                          'text-white bg-gradient-to-r from-primary to-[#d400ff] hover:opacity-95'
                        )}
                      >
                        {withTrial
                          ? t('plans.ctaPrimary')
                          : t('plans.ctaSecondary')}
                      </Button>
                    </form>

                    {withTrial && (
                      <p className="mt-3 text-center text-xs text-black/50">
                        {t('plans.disclaimer')}
                      </p>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
