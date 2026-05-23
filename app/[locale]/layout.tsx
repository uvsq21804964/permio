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
    title: 'Route-friendly booking software for mobile dog trainers',
    description:
      'MagicHango helps mobile dog trainers let clients book sessions while guiding them toward route-friendly slots, smart prices, and more profitable schedules.',
    keywords: [
      'dog trainer booking software',
      'mobile dog trainer scheduling',
      'route friendly booking',
      'dog training appointment software',
      'smart slot pricing',
    ],
    openGraphLocale: 'en_US',
  },
  fr: {
    title: 'Logiciel de reservation rentable pour educateurs canins mobiles',
    description:
      'MagicHango aide les educateurs canins mobiles a laisser les clients reserver tout en les guidant vers des creneaux compatibles avec la tournee, le trajet et la rentabilite.',
    keywords: [
      'logiciel educateur canin',
      'reservation educateur canin',
      'planning educateur canin mobile',
      'tournee educateur canin',
      'prix intelligent creneaux',
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
