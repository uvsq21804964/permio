// app/[locale]/layout.tsx
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/src/i18n/getMessages';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR, enUS } from '@clerk/localizations';
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
    title: 'Smart booking for dog trainers',
    description:
      'MagicHango helps dog trainers manage bookings, reduce travel time, organize appointments, and create a smoother booking experience for clients.',
    keywords: [
      'dog trainer booking',
      'dog trainer calendar',
      'dog training appointment software',
      'dog trainer route optimization',
      'pet service scheduling',
    ],
    openGraphLocale: 'en_US',
  },
  fr: {
    title: 'Réservation intelligente pour éducateurs canins',
    description:
      'MagicHango aide les éducateurs canins à gérer les réservations, réduire les déplacements, organiser les rendez-vous et fluidifier l’expérience client.',
    keywords: [
      'réservation éducateur canin',
      'agenda éducateur canin',
      'logiciel réservation éducateur canin',
      'optimisation planning éducateur canin',
      'gestion rendez-vous canins',
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
        <div className="h-full w-full">{children}</div>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}
