// src/i18n/request.ts

import { getRequestConfig } from 'next-intl/server';

const SUPPORTED = ['fr', 'en'] as const;
type Locale = (typeof SUPPORTED)[number];
const DEFAULT_LOCALE: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const l = (SUPPORTED as readonly string[]).includes(locale as string)
    ? (locale as Locale)
    : DEFAULT_LOCALE;

  // Chemin selon ton arbo (adapte ../messages si besoin)
  const messages = (await import(`../../messages/${l}.json`)).default;
  return { locale: l, messages };
});
