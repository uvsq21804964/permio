'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';

import CallToAction from '@/components/home/CallToAction';
import HowItWorks from '@/components/home/HowItWorks';
import HomeStatusCard from '@/components/home/HomeStatusCard';
import Plans from '@/components/home/PlansSansSimulation';
import HeroSection from '@/components/home/HeroSection';
import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

export default function HomePage() {
  const logo = '/NouveauLogoRogne2.png';
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();

  const { isLoaded, isSignedIn } = useUser();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    setRedirecting(true);
    const timeoutId = setTimeout(() => {
      router.replace(`/${locale}/plans`);
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [isLoaded, isSignedIn, locale, router]);

  if (!isLoaded) {
    return (
      <HomeStatusCard
        logo={logo}
        title={locale.startsWith('fr') ? 'Chargement...' : 'Loading...'}
        description={
          locale.startsWith('fr')
            ? 'Verification de votre session...'
            : 'Checking your session...'
        }
      />
    );
  }

  if (redirecting) {
    return (
      <HomeStatusCard
        logo={logo}
        title={locale.startsWith('fr') ? 'Redirection...' : 'Redirecting...'}
        description={
          locale.startsWith('fr')
            ? 'Vous etes deja connecte. Direction les offres.'
            : 'You are already signed in. Taking you to the plans page.'
        }
        cta={{
          href: `/${locale}/plans`,
          label: locale.startsWith('fr') ? 'Aller aux offres' : 'Go to plans',
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex h-10 md:h-12 max-w-6xl items-stretch justify-between px-4 md:px-8">
          <Link
            href={`/${locale}/home`}
            className="flex items-end gap-2 min-w-0"
          >
            <span className="relative h-full w-14 md:w-16 shrink-0">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="64px"
                className="object-contain object-bottom"
                priority
              />
            </span>

            <BrandWordmark className="hidden md:inline-flex" />
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] md:text-sm font-semibold text-white hover:bg-white hover:text-primary transition whitespace-nowrap"
            >
              {t('nav.blog')}
            </Link>

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

      <main className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-20">
        <HeroSection />
        <HowItWorks />
        <Plans withTrial />
        <Comparison />
        <FAQ />
        <CallToAction />
      </main>
    </div>
  );
}
