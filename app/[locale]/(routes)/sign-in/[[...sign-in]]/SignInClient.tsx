// app/[locale]/sign-in/[[...sign-in]]/SignInClient.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import Image from 'next/image';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import {
  appendClientOnboardingInvite,
  parseClientOnboardingInviteFromSearchParams,
} from '@/src/lib/client-onboarding-invite';
import { storeClientOnboardingInvite } from '@/src/lib/client-onboarding-invite-storage';

type Props = {
  locale: Locale;
  redirectUrl: string;
};

function withLocalePath(path: string, locale: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
}

export default function SignInClient({ locale, redirectUrl }: Props) {
  const logo = '/NouveauLogoRogne2.png';
  const searchParams = useSearchParams();
  const isFR = String(locale).startsWith('fr');
  const invite = parseClientOnboardingInviteFromSearchParams(searchParams);

  useEffect(() => {
    if (invite.isClientInvite) {
      storeClientOnboardingInvite(invite);
    }
  }, [invite]);

  const copy = {
    noAccount: isFR
      ? "Je n'ai pas encore de compte"
      : "I don't have an account yet",
  };

  const signUpHref = appendClientOnboardingInvite(
    withLocalePath('/sign-up', locale),
    invite,
  );

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      {/* NAVBAR FIXE EN HAUT */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex h-10 max-w-6xl items-stretch justify-between px-4 md:h-12 md:px-8">
          {/* Logo / marque */}
          <Link
            href={withLocalePath('/home', locale)}
            className="flex min-w-0 items-end gap-2"
          >
            <span className="relative h-full w-14 shrink-0 md:w-16">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="64px"
                className="object-contain object-bottom"
                priority
              />
            </span>

            <BrandWordmark />
          </Link>

          {/* Actions à droite */}
          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={signUpHref}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition whitespace-nowrap hover:bg-primary hover:text-white md:text-sm"
            >
              {copy.noAccount}
            </Link>

            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      {/* CONTENU */}
      <main className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-20">
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
