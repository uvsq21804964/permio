// app/[locale]/sign-in/page.tsx
'use client';

import { useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import { SignIn } from '@clerk/nextjs';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

export default function SignInPage() {
  const locale = useLocale() as Locale;

  return (
    <>
      <div className="fixed top-4 right-8 z-50">
        <LocaleSwitcher />
      </div>
      <div className="max-w-md mx-auto p-8">
        <SignIn
          fallbackRedirectUrl={withLocale('/myavailabilities', locale)}
          forceRedirectUrl={withLocale('/myavailabilities', locale)}
        />
      </div>
    </>
  );
}
