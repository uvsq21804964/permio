// app/[locale]/sign-in/page.tsx
'use client';

import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Image from 'next/image';

type Props = {
  locale: Locale;
  redirectUrl: string;
};

export default function SignInPage() {
  const locale = useLocale() as Locale;
  const logo = '/IconeSansFond.png';
  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      {/* NAVBAR FIXE EN HAUT */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
          <Link
            href={`/${locale}/home`}
            className="flex items-center gap-2 min-w-0"
          >
            {/* ✅ conteneur dimensionné + relative pour fill */}
            <span className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
              <Image
                src={logo}
                alt="Logo"
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

          {/* Actions à droite */}
          <nav className="flex items-center gap-2 md:gap-3">
            {/* CTA pour ceux qui ont déjà un compte */}
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] md:text-sm font-semibold text-primary shadow-sm hover:text-white hover:bg-primary transition whitespace-nowrap"
            >
              J'ai déjà un compte
            </Link>
            {/* Switcher de langue */}
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* CONTENU : décalé pour ne pas passer sous la navbar */}
      <main className="pt-16 md:pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <SignUp
            fallbackRedirectUrl={withLocale(
              '/onboarding/choose-organization',
              locale
            )}
            forceRedirectUrl={withLocale(
              '/onboarding/choose-organization',
              locale
            )}
          />
        </div>
      </main>
    </div>
  );
}
