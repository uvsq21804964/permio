// app/[locale]/sign-in/[[...sign-in]]/SignInClient.tsx
'use client';

import { SignIn } from '@clerk/nextjs';
import type { Locale } from '@/src/lib/i18n';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

type Props = {
  locale: Locale;
  redirectUrl: string;
};

export default function SignInClient({ locale, redirectUrl }: Props) {
  return (
    <>
      <div className="fixed top-4 right-8 z-50">
        <LocaleSwitcher />
      </div>

      <div className="max-w-md mx-auto p-8">
        <SignIn
          // Clerk est déjà localisé via ClerkProvider dans ton layout
          fallbackRedirectUrl={redirectUrl}
          forceRedirectUrl={redirectUrl}
        />
      </div>
    </>
  );
}
