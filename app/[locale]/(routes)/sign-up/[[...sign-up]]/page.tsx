// app/[locale]/sign-up/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
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

function withLocalePath(path: string, locale: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
}

export default function SignInPage() {
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();
  const isFR = String(locale).startsWith('fr');
  const logo = '/NouveauLogoRogne2.png';
  const invite = parseClientOnboardingInviteFromSearchParams(searchParams);

  useEffect(() => {
    if (invite.isClientInvite) {
      storeClientOnboardingInvite(invite);
    }
  }, [invite]);

  const copy = {
    alreadyAccount: isFR ? "J'ai déjà un compte" : 'I already have an account',
  };

  const next = appendClientOnboardingInvite(
    withLocalePath('/onboarding/choose-organization', locale),
    invite,
  );
  const signInHref = appendClientOnboardingInvite(
    withLocalePath('/sign-in', locale),
    invite,
  );

  return (
    <div className="min-h-screen bg-[#f9ffc6]/80">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex h-10 max-w-6xl items-stretch justify-between px-4 md:h-12 md:px-8">
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

          <nav className="flex items-center gap-2 md:gap-3">
            <Link
              href={signInHref}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition whitespace-nowrap hover:bg-primary hover:text-white md:text-sm"
            >
              {copy.alreadyAccount}
            </Link>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-20">
        <div className="max-w-md mx-auto px-4 py-8">
          <SignUp fallbackRedirectUrl={next} forceRedirectUrl={next} />
        </div>
      </main>
    </div>
  );
}
