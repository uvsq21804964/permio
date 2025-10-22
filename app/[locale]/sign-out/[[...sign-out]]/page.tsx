'use client';

import { SignOutButton } from '@clerk/nextjs';
import { useTranslations, useLocale } from 'next-intl';
import type { Locale } from '@/src/lib/i18n';
import { withLocale } from '@/src/lib/i18n';
import LocaleLink from '@/src/components/LocaleLink';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';

export default function SignOutPage() {
  const t = useTranslations('SignOut');
  const locale = useLocale() as Locale;

  return (
    <>
      <div className="fixed top-4 right-8 z-50">
        <LocaleSwitcher />
      </div>
      <div className="max-w-md mx-auto p-8">
        <h1 className="text-xl font-semibold mb-2">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('question')}</p>

        <div className="flex items-center gap-3">
          <SignOutButton
            signOutOptions={{ redirectUrl: withLocale('/sign-in', locale) }}
          >
            <button className="px-4 py-2 rounded bg-black text-white">
              {t('confirm')}
            </button>
          </SignOutButton>

          <LocaleLink
            href="/myavailabilities"
            className="px-4 py-2 rounded border hover:bg-muted transition"
          >
            {t('cancel')}
          </LocaleLink>
        </div>
      </div>
    </>
  );
}
