'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocaleNav } from '@/src/lib/useLocaleNav';
import { SUPPORTED_LOCALES, type Locale } from '@/src/lib/i18n';

const LABEL: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ro: 'Română',
};

// Map locale → code pays (pour l’anglais, choisis GB ou US)
const FLAG_CLASS: Record<Locale, string> = {
  fr: 'fi-fr',
  en: 'fi-gb',
  ro: 'fi-ro',
};

export function LocaleSwitcher() {
  const { locale, switchTo } = useLocaleNav();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm bg-background"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className={`fi ${FLAG_CLASS[locale as Locale]} fis rounded-[2px]`}
        />
        <span>{LABEL[locale as Locale]}</span>
        <span className="ml-1">▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 rounded-md border bg-background p-1 shadow-md"
        >
          {SUPPORTED_LOCALES.map((l) => (
            <li key={l}>
              <button
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  switchTo(l as Locale);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted ${
                  l === locale ? 'bg-muted' : ''
                }`}
              >
                <span
                  className={`fi ${FLAG_CLASS[l as Locale]} fis rounded-[2px]`}
                />
                <span>{LABEL[l as Locale]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
