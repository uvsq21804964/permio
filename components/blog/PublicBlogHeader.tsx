'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';
import { Suspense } from 'react';

import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { trackButtonClick } from '@/lib/client/button-tracking';
import type { Locale } from '@/src/lib/i18n';

type PublicBlogHeaderProps = {
  currentPath: '/blog' | '/demo';
  locale: Locale;
};

function PublicBlogHeaderAuthLinks({ locale }: { locale: Locale }) {
  return (
    <Suspense
      fallback={
        <Link
          href={`/${locale}/sign-up`}
          className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white whitespace-nowrap md:text-sm"
        >
          {locale === 'fr' ? 'Essayer 1 mois, sans carte' : 'Try 1 month, no card'}
        </Link>
      }
    >
      <SignedOut>
        <Link
          href={`/${locale}/sign-in`}
          onClick={() => {
            trackButtonClick({
              buttonKey: 'public_blog_header_sign_in',
              buttonLabel: locale === 'fr' ? 'Connexion' : 'Sign in',
              buttonContext: 'public_blog_header',
              targetHref: `/${locale}/sign-in`,
              locale,
            });
          }}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-primary whitespace-nowrap md:text-sm"
        >
          {locale === 'fr' ? 'Connexion' : 'Sign in'}
        </Link>

        <Link
          href={`/${locale}/sign-up`}
          onClick={() => {
            trackButtonClick({
              buttonKey: 'public_blog_header_sign_up',
              buttonLabel:
                locale === 'fr'
                  ? 'Essayer 1 mois, sans carte'
                  : 'Try 1 month, no card',
              buttonContext: 'public_blog_header',
              targetHref: `/${locale}/sign-up`,
              locale,
            });
          }}
          className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white whitespace-nowrap md:text-sm"
        >
          {locale === 'fr' ? 'Essayer 1 mois, sans carte' : 'Try 1 month, no card'}
        </Link>
      </SignedOut>

      <SignedIn>
        <Link
          href={`/${locale}/myweek`}
          onClick={() => {
            trackButtonClick({
              buttonKey: 'public_blog_header_open_app',
              buttonLabel: locale === 'fr' ? "Ouvrir l'app" : 'Open app',
              buttonContext: 'public_blog_header',
              targetHref: `/${locale}/myweek`,
              locale,
            });
          }}
          className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white whitespace-nowrap md:text-sm"
        >
          {locale === 'fr' ? "Ouvrir l'app" : 'Open app'}
        </Link>
      </SignedIn>
    </Suspense>
  );
}

export function PublicBlogHeader({
  currentPath,
  locale,
}: PublicBlogHeaderProps) {
  const logo = '/NouveauLogoRogne2.png';
  const demoLink = {
    href: `/${locale}/demo`,
    label: 'Demo',
    isActive: currentPath === '/demo',
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
      <div className="mx-auto flex h-10 max-w-6xl items-stretch justify-between px-4 md:h-12 md:px-8">
        <Link href={`/${locale}/home`} className="flex min-w-0 items-end gap-2">
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
          <BrandWordmark className="hidden md:inline-flex" />
        </Link>

        <nav className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center gap-1 md:flex">
            <Link
              href={demoLink.href}
              onClick={() => {
                trackButtonClick({
                  buttonKey: 'public_blog_header_demo',
                  buttonLabel: demoLink.label,
                  buttonContext: 'public_blog_header_desktop',
                  targetHref: demoLink.href,
                  locale,
                });
              }}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap ${
                demoLink.isActive
                  ? 'bg-white/18 text-white'
                  : 'text-white hover:bg-white hover:text-primary'
              }`}
            >
              {demoLink.label}
            </Link>
          </div>

          <Link
            href={demoLink.href}
            onClick={() => {
              trackButtonClick({
                buttonKey: 'public_blog_header_demo_mobile',
                buttonLabel: demoLink.label,
                buttonContext: 'public_blog_header_mobile',
                targetHref: demoLink.href,
                locale,
              });
            }}
            className={`inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold transition whitespace-nowrap md:hidden ${
              demoLink.isActive
                ? 'bg-white/18 text-white'
                : 'text-white hover:bg-white hover:text-primary'
            }`}
          >
            {demoLink.label}
          </Link>

          <PublicBlogHeaderAuthLinks locale={locale} />

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
