'use client';

import clsx from 'clsx';
import { Poppins } from 'next/font/google';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslations } from 'next-intl';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
});

type Currency = 'EUR' | 'USD';

type Plan = {
  id: string;
  title: string;
  prices: Record<Currency, number>;
  features: string[];
  highlighted?: boolean;
};

type Props = {
  /** true => version d'essai ; false => sans essai */
  withTrial: boolean;
};

function getCurrencyFromLocale(locale: string): Currency {
  return locale === 'en' ? 'USD' : 'EUR';
}

function formatCurrency(amount: number, currency: Currency, locale: string) {
  const nfLocale = locale === 'en' ? 'en-US' : 'fr-FR';

  return new Intl.NumberFormat(nfLocale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(amount);
}

// ✅ map plan -> Stripe lookup_key (adapte si besoin)
function getPriceLookupKey(planId: string, currency: Currency) {
  // Si tu n’as qu’un plan “pro”
  // - et que tes lookup_keys sont genre: pro_monthly_eur / pro_monthly_usd
  const c = currency.toLowerCase(); // 'eur' | 'usd'
  if (planId === 'pro') return `magic_monthly_${c}`;

  // fallback
  return `magic_monthly_${c}`;
}

export default function Plans({ withTrial }: Props) {
  const t = useTranslations('plans');
  const locale = useLocale(); // 'fr' | 'en'
  const currency = getCurrencyFromLocale(locale);

  const plans: readonly Plan[] = [
    {
      id: 'pro',
      title: t('plans.plan.title'),
      prices: { EUR: 32, USD: 34 },
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
  ];

  // 🔁 URLs de retour (ex: après checkout, revenir sur /billing)
  const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing?success=1&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/billing?canceled=1`;

  return (
    <main className="bg-[#f9ffc6]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        {/* Header */}
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

          {/* Bandeau */}
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-[#d400ff]/30 bg-white/70 backdrop-blur p-4 text-sm text-black/80">
            <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]">
              {t('plans.banner.label')}
              {' · '}
            </span>
            {t('plans.banner.text')}
          </div>
        </header>

        {/* Cards */}
        <section className="mt-8 flex justify-center">
          {plans.map((plan) => {
            const isHighlighted = Boolean(plan.highlighted);
            const price = plan.prices[currency];

            const priceLookupKey = getPriceLookupKey(plan.id, currency);

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
                      {formatCurrency(price, currency, locale)}
                    </span>
                    <span className="text-sm text-black/60">
                      {t('plans.perMonth')}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-black/50">
                    {t('plans.note')}
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

                {/* ✅ Checkout Stripe (POST) */}
                <form
                  action="/api/stripe/checkout"
                  method="POST"
                  className="mt-6"
                >
                  <input
                    type="hidden"
                    name="priceLookupKey"
                    value={priceLookupKey}
                  />
                  <input type="hidden" name="mode" value="subscription" />
                  <input type="hidden" name="successUrl" value={successUrl} />
                  <input type="hidden" name="cancelUrl" value={cancelUrl} />

                  {/* Optionnel: tu peux passer l’info au serveur (ne casse rien si ignoré) */}
                  <input
                    type="hidden"
                    name="trialMode"
                    value={withTrial ? 'trial' : 'no_trial'}
                  />

                  <Button
                    type="submit"
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

                <p className="mt-3 text-center text-xs text-black/50">
                  {t('plans.disclaimer')}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
