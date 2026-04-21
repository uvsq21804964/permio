// export const SUPPORTED_LOCALES = ['fr', 'en', 'ro'] as const;
export const SUPPORTED_LOCALES = ['fr', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'en';

function extractLocaleFromPath(pathname: string): Locale | null {
  const m = pathname.match(/^\/([a-zA-Z-]{2})(\/|$)/);
  const l = (m?.[1] || '').toLowerCase() as Locale;
  return (SUPPORTED_LOCALES as readonly string[]).includes(l) ? l : null;
}

/** Construit une URL locale-safe: withLocale('/sign-in','en') -> '/en/sign-in' */
export function withLocale(path: string, locale: Locale): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  // Si path a déjà un préfixe locale, on le remplace
  const hasLocale = extractLocaleFromPath(p);
  if (hasLocale) return p.replace(/^\/([a-zA-Z-]{2})(?=\/|$)/, `/${locale}`);
  return `/${locale}${p}`;
}

/** Construit la même URL mais en changeant juste la locale */
export function switchLocale(path: string, to: Locale): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const current = extractLocaleFromPath(p);
  if (!current) return `/${to}${p}`;
  return p.replace(/^\/([a-zA-Z-]{2})(?=\/|$)/, `/${to}`);
}
