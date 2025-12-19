// app/[locale]/sign-up/page.tsx
'use client';

import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Image from 'next/image';

function withLocalePath(path: string, locale: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
}

export default function SignInPage() {
  const locale = useLocale() as Locale;
  const isFR = String(locale).startsWith('fr');
  const logo = '/IconeSansFond.png';

  const copy = {
    alreadyAccount: isFR ? "J'ai déjà un compte" : 'I already have an account',
    brand: 'MagicHango',
  };

  const next = withLocalePath('/onboarding/choose-organization', locale);

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
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

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={withLocalePath('/sign-in', locale)}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] md:text-sm font-semibold text-primary shadow-sm hover:text-white hover:bg-primary transition whitespace-nowrap"
            >
              {copy.alreadyAccount}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-16 md:pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <SignUp fallbackRedirectUrl={next} forceRedirectUrl={next} />
        </div>
      </main>
    </div>
  );
}
