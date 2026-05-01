// src/i18n/request.ts

import { getRequestConfig } from 'next-intl/server';
import { getMessages } from '@/src/i18n/getMessages';

const SUPPORTED = ['fr', 'en'] as const;
type Locale = (typeof SUPPORTED)[number];
const DEFAULT_LOCALE: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  const l = (SUPPORTED as readonly string[]).includes(locale as string)
    ? (locale as Locale)
    : DEFAULT_LOCALE;

  const messages = await getMessages(l);
  return { locale: l, messages };
});
