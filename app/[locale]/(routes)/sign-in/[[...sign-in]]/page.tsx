// app/[locale]/sign-in/[[...sign-in]]/page.tsx
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import SignInClient from './SignInClient';

type Props = {
  params: Promise<{ locale: Locale }>;
};

export default async function SignInPage({ params }: Props) {
  const { locale } = await params;
  const redirectUrl = withLocale('/myweek', locale);

  return <SignInClient locale={locale} redirectUrl={redirectUrl} />;
}
