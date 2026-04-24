// app/[locale]/sign-in/[[...sign-in]]/page.tsx
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import {
  appendClientOnboardingInvite,
  parseClientOnboardingInvite,
} from '@/src/lib/client-onboarding-invite';
import SignInClient from './SignInClient';

type Props = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignInPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const invite = parseClientOnboardingInvite(resolvedSearchParams);
  const redirectUrl = appendClientOnboardingInvite(
    withLocale(
      invite.isClientInvite ? '/onboarding/choose-organization' : '/myweek',
      locale,
    ),
    invite,
  );

  return <SignInClient locale={locale} redirectUrl={redirectUrl} />;
}
