import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import {
  appendClientOnboardingInvite,
  parseClientOnboardingInvite,
} from '@/src/lib/client-onboarding-invite';

type Props = {
  params: Promise<{ locale: Locale; agencyCode: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function JoinAgencyPage({ params, searchParams }: Props) {
  const { locale, agencyCode } = await params;
  const resolvedSearchParams = await searchParams;
  const { userId } = await auth();

  const invite = parseClientOnboardingInvite({
    ...resolvedSearchParams,
    mode: 'client',
    agencyCode,
  });

  const target = appendClientOnboardingInvite(
    withLocale(
      userId ? '/onboarding/choose-organization' : '/sign-up',
      locale,
    ),
    invite,
  );

  redirect(target);
}
