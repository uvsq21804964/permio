import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR, enUS } from '@clerk/localizations';
import { roRO } from '@/src/i18n/clerk.ro';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: 'fr' | 'en' | 'ro' }>; // <= ajoute 'ro'
}) {
  const { locale } = await params;

  // Clerk n'a pas (à date) de pack ro prêt-à-l’emploi → fallback enUS ou objet custom.
  const clerkLocalization =
    locale === 'fr' ? frFR : locale === 'ro' ? roRO : enUS;

  const messages = await getMessages({ locale });

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
        <div className="w-full h-full">{children}</div>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ro' }]; // <= ajoute ro
}
