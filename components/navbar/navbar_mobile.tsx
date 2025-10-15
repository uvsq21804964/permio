'use client';

/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState } from 'react';
import Image from 'next/image';
import { OrganizationSwitcher, useOrganization } from '@clerk/nextjs';
import Link from 'next/link';

interface NavbarProps {
  logo: string;
  pages: { name: string; link: string }[];
  activeLink?: string;
}

const MobileNavbar: React.FC<NavbarProps> = ({ logo, pages, activeLink }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen((v) => !v);

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

            <div className="hidden md:flex items-center">
              {typeof window !== 'undefined' && <ShowSwitcherWhenOrg />}
            </div>
          </div>

          {/* Liens desktop (sans hook de path) */}
          <div className="hidden md:flex items-center gap-1">
            {pages.map((p) => {
              const isActive = activeLink ? activeLink === p.link : false;
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
                  {/* soulignement animé (reste purement visuel, pas basé sur un hook) */}
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

          {/* Actions à droite (mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            {typeof window !== 'undefined' && <ShowSwitcherWhenOrg />}
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
            {pages.map((p) => {
              const isActive = activeLink ? activeLink === p.link : false;
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

function ShowSwitcherWhenOrg() {
  const { organization } = useOrganization();
  if (!organization) return null;
  return <OrganizationSwitcher />;
}
