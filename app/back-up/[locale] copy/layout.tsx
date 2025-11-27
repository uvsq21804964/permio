// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR, enUS } from '@clerk/localizations';
import { roRO } from '@/src/i18n/clerk.ro';

type Props = {
  children: React.ReactNode;
  params: { locale: 'fr' | 'en' | 'ro' };
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = params;

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
  return [{ locale: 'fr' }, { locale: 'en' }, { locale: 'ro' }];
}
