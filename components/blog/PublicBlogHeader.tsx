import Image from 'next/image';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@clerk/nextjs';

import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import type { Locale } from '@/src/lib/i18n';

type PublicBlogHeaderProps = {
  currentPath: '/blog' | '/home';
  locale: Locale;
};

export function PublicBlogHeader({
  currentPath,
  locale,
}: PublicBlogHeaderProps) {
  const logo = '/NouveauLogoRogne2.png';
  const links = [
    {
      href: `/${locale}/home`,
      label: locale === 'fr' ? 'Accueil' : 'Home',
      isActive: currentPath === '/home',
    },
    {
      href: `/${locale}/blog`,
      label: 'Blog',
      isActive: currentPath === '/blog',
    },
  ];

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
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap ${
                  link.isActive
                    ? 'bg-white/18 text-white'
                    : 'text-white hover:bg-white hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <SignedOut>
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-primary whitespace-nowrap md:text-sm"
            >
              {locale === 'fr' ? 'Connexion' : 'Sign in'}
            </Link>

            <Link
              href={`/${locale}/sign-up`}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white whitespace-nowrap md:text-sm"
            >
              {locale === 'fr' ? 'Essayer gratuitement' : 'Try for free'}
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href={`/${locale}/myweek`}
              className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-white whitespace-nowrap md:text-sm"
            >
              {locale === 'fr' ? "Ouvrir l'app" : 'Open app'}
            </Link>
          </SignedIn>

          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}
