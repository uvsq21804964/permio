import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';

export default async function LocalizedRootPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const { userId } = await auth();

  redirect(withLocale(userId ? '/myweek' : '/home', locale));
}
