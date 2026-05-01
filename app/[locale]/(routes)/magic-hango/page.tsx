import { redirect } from 'next/navigation';
import type { Locale } from '@/src/lib/i18n';

export default async function MagicHangoRedirectPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/demo`);
}
