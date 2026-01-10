'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from './i18n';
import { withLocale, switchLocale } from './i18n';

export function useLocaleNav() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;
  const searchParams = useSearchParams();

  return {
    locale,
    pathname,
    push: (path: string) => router.push(withLocale(path, locale)),
    replace: (path: string) => router.replace(withLocale(path, locale)),
    switchTo: (to: Locale) => {
      const params = searchParams.toString();

      const nextPath = switchLocale(pathname, to);
      const url = params ? `${nextPath}?${params}` : nextPath;

      router.replace(url);
    },
    href: (path: string) => withLocale(path, locale), // pratique pour href
  };
}
