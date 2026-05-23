'use client';

import { ArrowRight, CalendarCheck, MapPinned, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { TrackedButton } from '@/components/tracking/TrackedButton';

const cards = [
  {
    key: 'booking',
    icon: CalendarCheck,
  },
  {
    key: 'route',
    icon: MapPinned,
  },
  {
    key: 'pricing',
    icon: Sparkles,
  },
] as const;

export default function AcquisitionGrowthSection() {
  const t = useTranslations('home');
  const locale = useLocale();

  return (
    <section className="bg-[#f9ffc6]/70 px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-black/10 bg-slate-950 text-white shadow-[0_40px_120px_-70px_rgba(15,23,42,0.95)]">
        <div className="relative grid gap-8 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(212,0,255,0.20),transparent_36%)]"
          />

          <div className="relative">
            <div className="inline-flex rounded-full border border-white/14 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              {t('growthSection.eyebrow')}
            </div>

            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight md:text-4xl md:leading-tight">
              {t('growthSection.title')}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              {t('growthSection.subtitle')}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-2xl font-semibold">
                  {t('growthSection.metrics.0.value')}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/64">
                  {t('growthSection.metrics.0.label')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-2xl font-semibold">
                  {t('growthSection.metrics.1.value')}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/64">
                  {t('growthSection.metrics.1.label')}
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <p className="text-2xl font-semibold">
                  {t('growthSection.metrics.2.value')}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/64">
                  {t('growthSection.metrics.2.label')}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <TrackedButton
                href={`/${locale}/sign-up`}
                trackingKey="home_growth_sign_up"
                trackingLabel={t('growthSection.ctaPrimary')}
                trackingContext="home_growth_section"
                trackingMetadata={{ locale, segment: 'mobile_dog_trainers' }}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-white/90"
              >
                {t('growthSection.ctaPrimary')}
                <ArrowRight className="ml-2 size-4" />
              </TrackedButton>

              <TrackedButton
                href={`/${locale}/demo`}
                trackingKey="home_growth_demo"
                trackingLabel={t('growthSection.ctaSecondary')}
                trackingContext="home_growth_section"
                trackingMetadata={{ locale, segment: 'mobile_dog_trainers' }}
                variant="outline"
                className="rounded-2xl border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-slate-950"
              >
                {t('growthSection.ctaSecondary')}
              </TrackedButton>
            </div>
          </div>

          <div className="relative grid gap-3">
            {cards.map(({ icon: Icon, key }, index) => (
              <article
                key={key}
                className="rounded-[1.5rem] border border-white/12 bg-white/[0.07] p-4 shadow-[0_20px_60px_-52px_rgba(255,255,255,0.55)] backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                      {t('growthSection.cards.step', { number: index + 1 })}
                    </div>
                    <h3 className="mt-1 text-base font-semibold">
                      {t(`growthSection.cards.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/67">
                      {t(`growthSection.cards.${key}.body`)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
