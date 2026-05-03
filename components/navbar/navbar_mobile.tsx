'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import { trackButtonClick } from '@/lib/client/button-tracking';
import {
  filterNavbarPages,
  stripLocalePrefix,
  withLocalePath,
  type NavbarRole,
  type NavPage,
} from '@/components/navbar/navbar-utils';

interface NavbarProps {
  logo: string;
  pages: NavPage[];
  activeLink?: string;
  meRole: NavbarRole;
}

const MobileNavbar: React.FC<NavbarProps> = ({
  logo,
  pages,
  activeLink,
  meRole,
}) => {
  const locale = useLocale();
  const isFR = locale.startsWith('fr');

  const pathname = usePathname();
  const currentPath = activeLink ?? pathname ?? '';
  const currentNoLocale = stripLocalePrefix(currentPath, locale);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((value) => !value);

  const visiblePages = useMemo(
    () => filterNavbarPages(pages, meRole),
    [pages, meRole],
  );

  const homeSrLabel = isFR ? 'Aller a l accueil' : 'Go to home';
  const burgerSrLabel = isMenuOpen
    ? isFR
      ? 'Fermer le menu'
      : 'Close menu'
    : isFR
      ? 'Ouvrir le menu'
      : 'Open menu';

  const trackNavClick = (page: NavPage, label: string, href: string, surface: string) => {
    trackButtonClick({
      buttonKey: page.cta ? 'app_nav_cta' : 'app_nav_link',
      buttonLabel: label,
      buttonContext: surface,
      targetHref: href,
      locale,
      metadata: {
        link: page.link,
        role: meRole,
        isCta: Boolean(page.cta),
      },
    });
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={withLocalePath('/myweek', locale)}
              className="flex items-end gap-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:focus:ring-neutral-600"
              onClick={() => {
                trackButtonClick({
                  buttonKey: 'app_nav_logo_home',
                  buttonLabel: homeSrLabel,
                  buttonContext: 'mobile_nav',
                  targetHref: withLocalePath('/myweek', locale),
                  locale,
                  metadata: { role: meRole },
                });
                setIsMenuOpen(false);
              }}
            >
              <span className="sr-only">{homeSrLabel}</span>
              <span className="relative h-10 w-12 shrink-0">
                <Image
                  src={logo}
                  alt="MagicHango"
                  fill
                  sizes="48px"
                  className="object-contain object-bottom"
                  priority
                />
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {visiblePages.map((page) => {
              const label = isFR ? page.nameFR : page.nameEN;
              const href = withLocalePath(page.link, locale);
              const isActive = currentNoLocale === page.link;

              if (page.cta) {
                return (
                  <Link
                    key={page.link}
                    href={href}
                    onClick={() => trackNavClick(page, label, href, 'mobile_nav_desktop_row')}
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold bg-navbar text-white shadow-sm transition hover:brightness-110 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navbar/60"
                  >
                    {label}
                  </Link>
                );
              }

              return (
                <Link
                  key={page.link}
                  href={href}
                  onClick={() => trackNavClick(page, label, href, 'mobile_nav_desktop_row')}
                  className={`group relative px-3 py-2 text-sm font-medium rounded-md transition hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 ${
                    isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {label}
                  <span
                    className={`pointer-events-none absolute inset-x-2 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 ${
                      isActive
                        ? 'scale-x-100 bg-neutral-900 dark:bg-neutral-100'
                        : 'bg-neutral-400/60 dark:bg-neutral-500/60'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          <div className="z-50">
            <LocaleSwitcher />
          </div>

          <button
            type="button"
            onClick={toggleMenu}
            aria-label={burgerSrLabel}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
          >
            <span className="sr-only">{burgerSrLabel}</span>
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={`md:hidden origin-top overflow-hidden transition-[max-height,opacity] duration-300 ease-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 pt-2 shadow-sm border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95">
          <div className="flex flex-col gap-1">
            {visiblePages.map((page) => {
              const label = isFR ? page.nameFR : page.nameEN;
              const href = withLocalePath(page.link, locale);
              const isActive = currentNoLocale === page.link;

              if (page.cta) {
                return (
                  <Link
                    key={page.link}
                    href={href}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium transition bg-navbar text-white shadow-sm hover:brightness-110 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                    onClick={() => {
                      trackNavClick(page, label, href, 'mobile_nav_menu');
                      setIsMenuOpen(false);
                    }}
                  >
                    {label}
                  </Link>
                );
              }

              return (
                <Link
                  key={page.link}
                  href={href}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700 ${
                    isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                  onClick={() => {
                    trackNavClick(page, label, href, 'mobile_nav_menu');
                    setIsMenuOpen(false);
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MobileNavbar;
