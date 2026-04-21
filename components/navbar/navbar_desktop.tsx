'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import {
  filterNavbarPages,
  PROFILE_LINKS,
  stripLocalePrefix,
  withLocalePath,
  type NavbarRole,
  type NavPage,
} from '@/components/navbar/navbar-utils';

export default function DesktopNavbar({
  logo,
  pages,
  activeLink,
  meRole,
}: {
  logo: string;
  pages: NavPage[];
  activeLink?: string;
  meRole: NavbarRole;
}) {
  const locale = useLocale();
  const isFR = locale.startsWith('fr');

  const pathname = usePathname();
  const currentPath = activeLink ?? pathname ?? '';

  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileBtnRef = useRef<HTMLButtonElement | null>(null);
  const profilePanelRef = useRef<HTMLDivElement | null>(null);

  const filteredPages = useMemo(
    () => filterNavbarPages(pages, meRole),
    [pages, meRole],
  );

  const profileItems = useMemo(
    () => filteredPages.filter((page) => PROFILE_LINKS.has(page.link)),
    [filteredPages],
  );
  const mainNavPages = useMemo(
    () => filteredPages.filter((page) => !PROFILE_LINKS.has(page.link)),
    [filteredPages],
  );

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!profileOpen) return;

      const target = event.target as Node;
      if (
        profilePanelRef.current &&
        !profilePanelRef.current.contains(target) &&
        profileBtnRef.current &&
        !profileBtnRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [profileOpen]);

  const homeSrLabel = isFR ? 'Aller a l accueil' : 'Go to home';
  const profileMenuLabel = isFR ? 'Menu profil' : 'Profile menu';
  const accountLabel = isFR ? 'Mon compte' : 'Account';
  const burgerSrLabel = isFR ? 'Ouvrir le menu' : 'Open menu';
  const currentNoLocale = stripLocalePrefix(currentPath, locale);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-neutral-200 bg-white/90 text-white backdrop-blur supports-[backdrop-filter]:bg-[#8920D1] dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex h-10 items-center justify-between px-0">
        <Link
          href={withLocalePath('/myweek', locale)}
          className="h-10 w-[12rem] pl-0 dark:focus:ring-neutral-600"
        >
          <span className="sr-only">{homeSrLabel}</span>
          <div className="relative h-full w-full">
            <Image
              src={logo}
              alt="Logo"
              fill
              sizes="(max-width: 640px) 160px, 192px"
              className="object-contain"
              priority
            />
          </div>
        </Link>

        <div className="flex-1">
          <div className="mx-auto max-w-7xl pr-4 sm:pr-6">
            <div className="flex h-16 items-center justify-end gap-2">
              <div className="hidden md:flex items-center gap-2">
                {mainNavPages.map((page) => {
                  const label = isFR ? page.nameFR : page.nameEN;
                  const href = withLocalePath(page.link, locale);
                  const isActive = currentNoLocale === page.link;

                  if (page.cta) {
                    return (
                      <Link
                        key={page.link}
                        href={href}
                        className="inline-flex items-center justify-center rounded-md bg-navbar px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-navbar/60 focus:ring-offset-2"
                      >
                        {label}
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={page.link}
                      href={href}
                      className={`group relative rounded-md px-3 py-2 text-sm font-medium transition hover:bg-neutral-100/60 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2 dark:hover:bg-neutral-800/60 dark:focus:ring-neutral-700 ${
                        isActive
                          ? 'text-white dark:text-white'
                          : 'text-white-600 dark:text-neutral-300'
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

                {profileItems.length > 0 && (
                  <div className="relative">
                    <button
                      ref={profileBtnRef}
                      onClick={() => setProfileOpen((value) => !value)}
                      aria-expanded={profileOpen}
                      aria-haspopup="menu"
                      className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-100/60 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2 dark:text-neutral-300 dark:hover:bg-neutral-800/60 dark:focus:ring-neutral-700"
                    >
                      <span>{accountLabel}</span>
                      <svg
                        className={`h-4 w-4 transition-transform ${
                          profileOpen ? 'rotate-180' : ''
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {profileOpen && (
                      <div
                        ref={profilePanelRef}
                        role="menu"
                        aria-label={profileMenuLabel}
                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-white/95 shadow-lg backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95"
                      >
                        <ul className="py-1 text-sm">
                          {profileItems.map((page) => {
                            const label = isFR ? page.nameFR : page.nameEN;
                            const href = withLocalePath(page.link, locale);
                            const isActive = currentNoLocale === page.link;

                            return (
                              <li key={page.link}>
                                <Link
                                  role="menuitem"
                                  href={href}
                                  onClick={() => setProfileOpen(false)}
                                  className={`flex items-center justify-between px-3 py-2 transition hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:hover:bg-neutral-800 dark:focus:bg-neutral-800 ${
                                    isActive
                                      ? 'text-neutral-900 dark:text-neutral-50'
                                      : 'text-neutral-700 dark:text-neutral-300'
                                  }`}
                                >
                                  <span>{label}</span>
                                  {isActive ? (
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <LocaleSwitcher />
              </div>

              <button
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls="mobile-menu"
                className="inline-flex items-center justify-center rounded-md p-2 md:hidden hover:bg-neutral-100/60 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-offset-2 dark:hover:bg-neutral-800/60 dark:focus:ring-neutral-700"
              >
                <span className="sr-only">{burgerSrLabel}</span>
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {open ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
