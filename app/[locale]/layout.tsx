// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from '@/src/i18n/getMessages';
import { ClerkProvider } from '@clerk/nextjs';
import { frFR, enUS } from '@clerk/localizations';
import type { Locale } from '@/src/lib/i18n';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  // ⬇️ c’est ça que Next 15 veut maintenant
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
        <div className="w-full h-full">{children}</div>
      </NextIntlClientProvider>
    </ClerkProvider>
  );
}

export function generateStaticParams() {
  return [{ locale: 'fr' }, { locale: 'en' }];
}
