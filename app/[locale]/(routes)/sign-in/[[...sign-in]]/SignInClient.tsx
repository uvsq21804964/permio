// app/[locale]/sign-in/[[...sign-in]]/SignInClient.tsx
'use client';

import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import type { Locale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Image from 'next/image';

type Props = {
  locale: Locale;
  redirectUrl: string;
};

function withLocalePath(path: string, locale: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
}

export default function SignInClient({ locale, redirectUrl }: Props) {
  const logo = '/IconeSansFond.png';
  const isFR = String(locale).startsWith('fr');

  const copy = {
    noAccount: isFR
      ? "Je n'ai pas encore de compte"
      : "I don't have an account yet",
    brand: 'MagicHango',
  };

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      {/* NAVBAR FIXE EN HAUT */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
          {/* Logo / marque */}
          <Link
            href={withLocalePath('/home', locale)}
            className="flex items-center gap-2 min-w-0"
          >
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
              {copy.brand}
            </span>
          </Link>

          {/* Actions à droite */}
          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={withLocalePath('/sign-up', locale)}
              className="inline-flex items-center rounded-full bg-white/95 hover:text-white hover:bg-primary px-3 py-1.5 text-[11px] md:text-sm font-semibold text-primary shadow-sm transition whitespace-nowrap"
            >
              {copy.noAccount}
            </Link>

            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* CONTENU */}
      <main className="pt-16 md:pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <SignIn
            fallbackRedirectUrl={redirectUrl}
            forceRedirectUrl={redirectUrl}
          />
        </div>
      </main>
    </div>
  );
}
