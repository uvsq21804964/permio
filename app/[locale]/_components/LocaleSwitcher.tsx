'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocaleNav } from '@/src/lib/useLocaleNav';
import { SUPPORTED_LOCALES, type Locale } from '@/src/lib/i18n';

const LABEL: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  // ro: 'Română',
};

// Map locale → code pays (pour l’anglais on choisit GB ici)
const FLAG_CLASS: Record<Locale, string> = {
  en: 'fi-us',
  fr: 'fi-fr',
  // ro: 'fi-ro',
};

export function LocaleSwitcher() {
  const { locale, switchTo } = useLocaleNav();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sécurité : si le locale actuel n’est pas dans la liste, on force "en"
  const currentLocale: Locale = (
    SUPPORTED_LOCALES.includes(locale as Locale) ? locale : 'en'
  ) as Locale;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-full p-0.5 md:p-1 bg-transparent border border-transparent hover:bg-white/10 transition"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`fi ${FLAG_CLASS[currentLocale]} fis rounded-[2px]`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-36 rounded-md border bg-background p-1 shadow-md"
        >
          {SUPPORTED_LOCALES.map((l) => {
            const loc = l as Locale;
            return (
              <li key={loc}>
                <button
                  role="option"
                  aria-selected={loc === currentLocale}
                  onClick={() => {
                    switchTo(loc);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted ${
                    loc === currentLocale ? 'bg-muted' : ''
                  }`}
                >
                  <span className={`fi ${FLAG_CLASS[loc]} fis rounded-[2px]`} />
                  {/* On garde le label dans le menu pour la compréhension,
                      mais rien n’est affiché sur le bouton principal */}
                  <span className="text-black">{LABEL[loc]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
