// app/page.tsx

import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SUPPORTED_LOCALES, type Locale, withLocale } from '@/src/lib/i18n';

async function getPreferredLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value?.toLowerCase();
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : 'en';
}

export default async function Home() {
  const { userId } = await auth();
  const locale = await getPreferredLocaleFromCookie();

  if (!userId) {
    redirect(withLocale('/home', locale));
  }

  redirect(withLocale('/myweek', locale));
}
