// app/[locale]/sign-in/page.tsx
'use client';

import { SignUp } from '@clerk/nextjs';
import { useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

export default function SignInPage() {
  const locale = useLocale() as Locale;

  return (
    <>
      {/* Switcher fixé en haut à droite de la fenêtre */}
      <div className="fixed top-4 right-8 z-50">
        <LocaleSwitcher />
      </div>

      {/* Contenu centré comme avant */}
      <div className="max-w-md mx-auto p-8">
        <SignUp
          fallbackRedirectUrl={withLocale(
            '/onboarding/choose-organization',
            locale
          )}
          forceRedirectUrl={withLocale(
            '/onboarding/choose-organization',
            locale
          )}
        />
      </div>
    </>
  );
}
