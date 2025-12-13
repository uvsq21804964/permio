// app/[locale]/sign-in/[[...sign-in]]/page.tsx
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import SignInClient from './SignInClient';

type Props = {
  params: { locale: Locale };
};

export default function SignInPage({ params: { locale } }: Props) {
  const redirectUrl = withLocale('/myweek', locale);

  return <SignInClient locale={locale} redirectUrl={redirectUrl} />;
}
