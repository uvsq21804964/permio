// app/[locale]/sign-out/[[...sign-out]]/page.tsx
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import SignOutClient from './SignOutClient';

type Props = {
  params: {
    locale: Locale;
  };
};

export default async function SignOutPage({ params: { locale } }: Props) {
  const t = await getTranslations('SignOut');

  const title = t('title');
  const question = t('question');
  const confirm = t('confirm');
  const cancel = t('cancel');

  // URLs déjà localisées
  const redirectUrl = withLocale('/sign-in', locale);
  const cancelUrl = withLocale('/myavailabilities', locale);

  return (
    <SignOutClient
      title={title}
      question={question}
      confirm={confirm}
      cancel={cancel}
      redirectUrl={redirectUrl}
      cancelUrl={cancelUrl}
    />
  );
}
