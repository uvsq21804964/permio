'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from './i18n';
import { withLocale, switchLocale } from './i18n';

export function useLocaleNav() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  return {
    locale,
    pathname,
    push: (path: string) => router.push(withLocale(path, locale)),
    replace: (path: string) => router.replace(withLocale(path, locale)),
    switchTo: (to: Locale) => router.replace(switchLocale(pathname, to)),
    href: (path: string) => withLocale(path, locale), // pratique pour href
  };
}
