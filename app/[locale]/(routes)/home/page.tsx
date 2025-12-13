'use client';

import React from 'react';

import CallToAction from '@/components/home/CallToAction';
import HowItWorks from '@/components/home/HowItWorks';
import Plans from '@/components/home/PlansSansSimulation';
import CompetitorComparison from '@/components/home/PropositionValeur';
import HeroSection from '@/components/home/HeroSection';
import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import Link from 'next/link';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

export default function HomePage() {
  const logo = '/IconeSansFond.png';
  const t = useTranslations('home');
  const locale = useLocale();
  //  `/${locale}/sign-in`
  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
          {/* Logo / marque */}
          <Link
            href={`/${locale}/home`}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
              <Image
                src={logo}
                alt={'MagicHango'}
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </span>

            <span className="truncate text-sm md:text-base font-semibold tracking-tight">
              MagicHango
            </span>
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] md:text-sm font-semibold text-white hover:bg-white hover:text-primary transition whitespace-nowrap"
            >
              {t('nav.login')}
            </Link>

            <Link
              href={`/${locale}/sign-up`}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] md:text-sm font-semibold text-primary shadow-sm hover:bg-primary hover:text-white transition whitespace-nowrap"
            >
              {t('nav.tryFree')}
            </Link>

            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-16 md:pt-20">
        <HeroSection />
        <HowItWorks />
        <Plans />
        <Comparison />
        <FAQ />
        <CompetitorComparison />
        <CallToAction />
      </main>
    </div>
  );
}
