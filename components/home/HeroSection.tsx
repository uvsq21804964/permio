'use client';

import React from 'react';
import Image from 'next/image';
import { Sparkles, CalendarDays, MapPinned } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { TrackedButton } from '@/components/tracking/TrackedButton';

const poppins = { className: 'font-sans' };

export default function HeroSection() {
  const t = useTranslations('heroSection');
  const locale = useLocale();
  const scheduleSrc = locale.startsWith('fr')
    ? '/MyWeek2.png'
    : '/MyWeekEN2.png';

  return (
    <section
      className="
        relative overflow-hidden text-black
        bg-gradient-to-b from-[#f9ffc6]/80 via-brand to-[#f9ffc6]/40
        pt-24 sm:pt-28
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]
          bg-white/5
        "
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-10 sm:pb-14 md:pb-20 md:px-6">
        {/* Layout responsive */}
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* TEXTE */}
          <div className="w-full max-w-2xl text-center lg:text-left">
            <h1
              className={`
                ${poppins.className}
                text-[clamp(1.75rem,5vw,3.25rem)]
                font-black tracking-tight leading-tight
                text-black
                mb-3 sm:mb-4 md:mb-6
              `}
            >
              {t('hero.titlePrefix')}{' '}
              <span className="decoration-brand/30 underline-offset-4 text-primary">
                {t('hero.highlight1')}
              </span>{' '}
              {t('hero.titleMiddle')}{' '}
              <span className="decoration-brand/30 underline-offset-4 text-primary">
                {t('hero.highlight2')}
              </span>
              {t('hero.titleSuffix')}{' '}
              <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
                <span className="bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-transparent">
                  MagicHango
                </span>
                <Sparkles
                  aria-hidden
                  className="
                    inline-block
                    h-[0.85em] w-[0.85em]
                    text-[#d400ff]
                    translate-y-[-0.25em] sm:translate-y-[-0.35em]
                    motion-safe:animate-pulse
                  "
                />
              </span>
            </h1>

            <h2
              className={`
                ${poppins.className}
                text-[clamp(1.05rem,2.8vw,1.75rem)]
                font-semibold tracking-tight leading-snug
                text-black/90
                mb-6 sm:mb-8
              `}
            >
              {t('hero.subtitlePrefix')}{' '}
              <span className="text-brand font-semibold">
                {t('hero.subtitleEmphasis')}
              </span>
            </h2>

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
              <TrackedButton
                href={`/${locale}/sign-up`}
                trackingKey="home_hero_sign_up"
                trackingLabel={t('hero.ctaPrimary')}
                trackingContext="home_hero"
                trackingMetadata={{ locale }}
                className="
                  w-full sm:w-auto
                  px-6 md:px-8 py-3 text-base md:text-lg font-semibold
                  bg-primary text-brand hover:bg-primary/90
                  rounded-2xl shadow-lg hover:shadow-xl transition
                "
              >
                {t('hero.ctaPrimary')}
              </TrackedButton>

              <TrackedButton
                href={`/${locale}/sign-in`}
                trackingKey="home_hero_sign_in"
                trackingLabel={t('hero.ctaSecondary')}
                trackingContext="home_hero"
                trackingMetadata={{ locale }}
                variant="outline"
                className="
                  w-full sm:w-auto
                  px-6 md:px-8 py-3 text-base md:text-lg font-semibold
                  bg-white text-primary border-primary/60
                  hover:bg-[#d400ff] hover:text-white
                  rounded-2xl backdrop-blur-sm
                "
              >
                {t('hero.ctaSecondary')}
              </TrackedButton>
            </div>
          </div>

          {/* VISUEL “IPHONE” */}
          <div className="w-full max-w-[420px] flex justify-center lg:justify-end">
            <figure className="w-[320px] sm:w-[360px]">
              {/* Cadre téléphone */}
              <div
                className="
        relative aspect-[9/19.5]
        rounded-[2.75rem]
        bg-black
        p-[10px]
        shadow-[0_30px_80px_rgba(0,0,0,0.25)]
      "
              >
                {/* “Bezel” intérieur */}
                <div className="relative h-full w-full rounded-[2.35rem] bg-white overflow-hidden">
                  {/* ✅ Notch (au-dessus de tout) */}
                  <div className="max-sm:hidden absolute left-1/2 top-2 z-5 h-6 w-28 -translate-x-1/2 rounded-full bg-black/95 shadow-[0_6px_16px_rgba(0,0,0,0.35)]" />
                  <div className="md:hidden absolute left-1/2 top-2 z-5 h-4 w-4 -translate-x-1/2 rounded-full bg-black/95 shadow-[0_6px_16px_rgba(0,0,0,0.35)]" />

                  {/* ✅ Status bar (avec fond opaque) */}
                  <div className="absolute left-0 right-0 top-0 z-4">
                    <div className="h-8 bg-white/95 backdrop-blur-sm" />

                    <div className="absolute left-0 right-0 top-0 px-6 pt-3">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-black/90">
                        <span>09:41</span>

                        <div className="flex items-center gap-2">
                          {/* signal */}
                          <span className="inline-flex items-end gap-[2px]">
                            <span className="h-[4px] w-[2px] rounded bg-black/80" />
                            <span className="h-[6px] w-[2px] rounded bg-black/80" />
                            <span className="h-[8px] w-[2px] rounded bg-black/80" />
                            <span className="h-[10px] w-[2px] rounded bg-black/80" />
                          </span>

                          {/* wifi */}
                          <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-black/80"
                            fill="none"
                          >
                            <path
                              d="M2.5 8.5C8.5 3.5 15.5 3.5 21.5 8.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M5.5 11.5C10 7.8 14 7.8 18.5 11.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M8.8 14.7C11.1 12.9 12.9 12.9 15.2 14.7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <circle
                              cx="12"
                              cy="18"
                              r="1.6"
                              fill="currentColor"
                            />
                          </svg>

                          {/* battery */}
                          <span className="relative inline-flex h-4 w-7 items-center rounded-[5px] border border-black/70 px-[2px]">
                            <span className="h-2.5 w-[70%] rounded-[3px] bg-black/80" />
                            <span className="absolute -right-[3px] top-1/2 h-2 w-[3px] -translate-y-1/2 rounded-r bg-black/70" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ✅ Écran principal : planning (descendu sous la status bar) */}
                  <div className="absolute inset-0 pt-14 mt-8">
                    <Image
                      src={scheduleSrc}
                      alt={t('preview.altSchedule')}
                      fill
                      className="object-cover object-top"
                      priority
                    />
                  </div>

                  {/* ✅ Carte overlay : centrée (presque au centre) + plus haute */}
                  <div
                    className="
            absolute left-2 right-2 top-1/2 -translate-y-1/4 z-3
            rounded-[1.35rem]
            bg-white/95
            overflow-hidden
            flex flex-col
            border border-black/20
            ring-1 ring-black/10
            shadow-[0_26px_70px_rgba(0,0,0,0.54)]
          "
                  >
                    {/* Header : logo centré et plus gros */}
                    <div className="relative z-3 px-3 py-2 bg-white/95">
                      <div className="relative flex items-center justify-center">
                        <Image
                          src="/GoogleMaps.svg"
                          alt="Google Maps"
                          width={112}
                          height={112}
                          className="shrink-0"
                        />

                        {/* Badge à droite (optionnel) */}
                        <span className="absolute right-0 text-[11px] text-black/50">
                          {t('preview.badgeRoute')}
                        </span>
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div className="h-px w-full bg-black/15" />

                    {/* Map : un peu plus haute */}
                    <div className="relative w-full aspect-[10/10] z-2">
                      <Image
                        src="/maps.png"
                        alt={t('preview.altRoute')}
                        fill
                        className="object-cover scale-[1.25] origin-center"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>
              </div>

              <figcaption className="mt-3 text-center text-xs text-black/60">
                {t('preview.caption')}
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
