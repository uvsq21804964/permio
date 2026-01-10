'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useUser } from '@clerk/nextjs';

import CallToAction from '@/components/home/CallToAction';
import HowItWorks from '@/components/home/HowItWorks';
import Plans from '@/components/home/PlansSansSimulation';
import CompetitorComparison from '@/components/home/PropositionValeur';
import HeroSection from '@/components/home/HeroSection';
import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

export default function HomePage() {
  const logo = '/NouveauLogoRogne2.png';
  const t = useTranslations('home');
  const locale = useLocale();
  const router = useRouter();

  const { isLoaded, isSignedIn } = useUser();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) return;

    setRedirecting(true);
    const to = setTimeout(() => {
      router.replace(`/${locale}/plans`);
    }, 400);

    return () => clearTimeout(to);
  }, [isLoaded, isSignedIn, locale, router]);

  // ✅ Attendre la fin du chargement Clerk
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#f9ffc6]/80 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-6 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <span className="relative h-9 w-9">
              <Image
                src={logo}
                alt="DingDog"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-base font-semibold text-black">DingDog</span>
          </div>

          <div className="text-lg font-bold text-black">
            {locale.startsWith('fr') ? 'Chargement…' : 'Loading…'}
          </div>
          <p className="mt-2 text-sm text-black/60">
            {locale.startsWith('fr')
              ? 'Vérification de votre session…'
              : 'Checking your session…'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ Utilisateur connecté => redirection + message
  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#f9ffc6]/80 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-6 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center gap-2">
            <span className="relative h-9 w-9">
              <Image
                src={logo}
                alt="DingDog"
                fill
                sizes="36px"
                className="object-contain"
                priority
              />
            </span>
            <span className="text-base font-semibold text-black">DingDog</span>
          </div>

          <div className="text-lg font-bold text-black">
            {locale.startsWith('fr') ? 'Redirection…' : 'Redirecting…'}
          </div>
          <p className="mt-2 text-sm text-black/60">
            {locale.startsWith('fr')
              ? 'Vous êtes déjà connecté. Direction les offres.'
              : 'You are already signed in. Taking you to the plans page.'}
          </p>

          <div className="mt-5">
            <Link
              href={`/${locale}/plans`}
              className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              {locale.startsWith('fr') ? 'Aller aux offres' : 'Go to plans'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Non connecté => Home
  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        {/* ✅ navbar avec hauteur définie */}
        <div className="mx-auto flex h-10 md:h-12 max-w-6xl items-stretch justify-between px-4 md:px-8">
          {/* ✅ Logo: collé en bas + fait 100% de la hauteur de la navbar */}
          <Link
            href={`/${locale}/home`}
            className="flex items-end gap-2 min-w-0"
          >
            {/* ✅ h-full = toute la hauteur de la navbar */}
            <span className="relative h-full w-14 md:w-16 shrink-0">
              <Image
                src={logo}
                alt="DingDog"
                fill
                sizes="64px"
                className="object-contain object-bottom" // ✅ ancré en bas
                priority
              />
            </span>

            <span className="truncate text-sm md:text-base font-semibold tracking-tight leading-none pb-1">
              DingDog
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
        <Plans withTrial={true} />
        <Comparison />
        <FAQ />
        {/* <CompetitorComparison /> */}
        <CallToAction />
      </main>
    </div>
  );
}
