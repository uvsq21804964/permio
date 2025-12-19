// app/[locale]/sign-out/[[...sign-out]]/page.tsx
import type { Locale } from '@/src/lib/i18n';
import { getTranslations } from 'next-intl/server';
import SignOutClient from './SignOutClient';

export default async function SignOutPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'SignOut' });

  return (
    <SignOutClient
      title={t('title')}
      question={t('question')}
      confirm={t('confirm')}
      cancel={t('cancel')}
      redirectUrl={`/${locale}/sign-in`}
      cancelUrl={`/${locale}/myweek`}
    />
  );
}
