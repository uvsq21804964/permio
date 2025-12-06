'use client';

/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Page = { name: string; link: string; visible: number; cta?: boolean };

interface NavbarProps {
  logo: string;
  pages: Page[];
  activeLink?: string;
  meRole: 'student' | 'instructor' | 'admin' | string | null; // ⬅️ rôle passé depuis le layout serveur
}

const MobileNavbar: React.FC<NavbarProps> = ({
  logo,
  pages,
  activeLink,
  meRole,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);

  // Filtre : si role = student, ne pas afficher les pages où p.student === false
  const visiblePages = pages.filter((p) => {
    if (meRole === 'instructor') {
      return p.visible === 0 || p.visible === 2;
    }
    if (meRole === 'student') {
      return p.visible === 1 || p.visible === 2;
    }
    if (meRole === 'admin') {
      return true;
    }
    // rôle inconnu / non connecté → seulement les pages pour les deux
    return p.visible === 2;
  });

  return (
    <nav className="fixed inset-x-0 top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo + switcher */}
          <div className="flex items-center gap-4">
            <Link
              href="/accueil"
              className="relative h-10 w-24 block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 rounded"
            >
              <Image
                src={logo}
                alt="Logo"
                fill
                sizes="96px"
                className="object-contain"
                priority
              />
            </Link>
          </div>

          {/* Liens desktop (sans hook de path) */}
          <div className="hidden md:flex items-center gap-1">
            {visiblePages.map((p) => {
              const isActive = activeLink ? activeLink === p.link : false;

              if (p.cta) {
                return (
                  <Link
                    key={p.name}
                    href={p.link}
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold
                               bg-navbar text-white shadow-sm transition hover:brightness-110 active:translate-y-px
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navbar/60"
                  >
                    {p.name}
                  </Link>
                );
              }

              return (
                <Link
                  key={p.name}
                  href={p.link}
                  className={`group relative px-3 py-2 text-sm font-medium rounded-md transition 
                  hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700
                  ${
                    isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {p.name}
                  <span
                    className={`pointer-events-none absolute inset-x-2 -bottom-0.5 h-px origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100 
                    ${
                      isActive
                        ? 'scale-x-100 bg-neutral-900 dark:bg-neutral-100'
                        : 'bg-neutral-400/60 dark:bg-neutral-500/60'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Burger */}
          <button
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            className="md:hidden inline-flex items-center justify-center rounded-md p-2 
            hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
          >
            <span className="sr-only">Ouvrir le menu</span>
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

      {/* Menu mobile (slide + ombre) */}
      <div
        id="mobile-menu"
        className={`md:hidden origin-top overflow-hidden transition-[max-height,opacity] duration-300 ease-out 
        ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-2 shadow-sm border-t border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95">
          <div className="flex flex-col gap-1">
            {visiblePages.map((p) => {
              const isActive = activeLink ? activeLink === p.link : false;

              if (p.cta) {
                return (
                  <Link
                    key={p.name}
                    href={p.link}
                    className="w-full rounded-lg px-3 py-2 text-sm font-medium transition 
                               bg-navbar text-white shadow-sm hover:brightness-110 active:translate-y-px
                               focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700"
                  >
                    {p.name}
                  </Link>
                );
              }

              return (
                <Link
                  key={p.name}
                  href={p.link}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition 
                  hover:bg-neutral-100 dark:hover:bg-neutral-800
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-300 dark:focus:ring-neutral-700
                  ${
                    isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-600 dark:text-neutral-300'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {p.name}
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
