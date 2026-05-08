// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/src/i18n/getMessages';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR, enUS } from '@clerk/localizations';
import { UserJourneyTracker } from '@/components/tracking/UserJourneyTracker';
import type { Locale } from '@/src/lib/i18n';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
};

const LOCALIZED_METADATA: Record<
  Locale,
  {
    title: string;
    description: string;
    keywords: string[];
    openGraphLocale: string;
  }
> = {
  en: {
    title: 'Missed-call booking workflow for mobile pet groomers',
    description:
      'MagicHango helps mobile pet groomers turn missed calls into qualified, route-friendly bookings with SMS follow-up, pet intake, and approval-first scheduling.',
    keywords: [
      'mobile pet groomer booking',
      'mobile dog grooming software',
      'missed call sms follow up',
      'route friendly bookings',
      'pet grooming scheduling',
    ],
    openGraphLocale: 'en_US',
  },
  fr: {
    title: 'Workflow d’appels manqués pour toiletteurs mobiles',
    description:
      'MagicHango aide les toiletteurs mobiles à transformer les appels manqués en rendez-vous qualifiés et compatibles avec leur tournée grâce au SMS, à la qualification client et à la validation avant confirmation.',
    keywords: [
      'logiciel toiletteur mobile',
      'toilettage mobile appels manqués',
      'suivi sms appels manqués',
      'rendez-vous compatibles tournée',
      'prise de rendez-vous toilettage mobile',
    ],
    openGraphLocale: 'fr_FR',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const localized = LOCALIZED_METADATA[locale];

  return {
    title: localized.title,
    description: localized.description,
    keywords: localized.keywords,
    openGraph: {
      title: localized.title,
      description: localized.description,
      locale: localized.openGraphLocale,
    },
    twitter: {
      title: localized.title,
      description: localized.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  const clerkLocalization = locale === 'fr' ? frFR : enUS;
  const messages = await getMessages(locale);

  return (
    <ClerkProvider
      localization={clerkLocalization}
      signInUrl={`/${locale}/sign-in`}
      signUpUrl={`/${locale}/sign-up`}
      afterSignOutUrl={`/${locale}/sign-in`}
      taskUrls={{
        'choose-organization': `/${locale}/onboarding/choose-organization`,
      }}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <UserJourneyTracker locale={locale} />
        <div className="h-full w-full">{children}</div>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}
