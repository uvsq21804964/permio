// app/[locale]/sign-out/[[...sign-out]]/SignOutClient.tsx
'use client';

import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import { useLocale } from 'next-intl';

type Props = {
  title: string;
  question: string;
  confirm: string;
  cancel: string;
  redirectUrl: string;
  cancelUrl: string;
};

function withLocalePath(path: string, locale: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith(`/${locale}/`) ? p : `/${locale}${p}`;
}

export default function SignOutClient({
  title,
  question,
  confirm,
  cancel,
  redirectUrl,
  cancelUrl,
}: Props) {
  const locale = useLocale();
  const isFR = locale.startsWith('fr');

  // ✅ sécurise les urls si jamais elles arrivent sans préfixe
  const cancelHref = withLocalePath(cancelUrl, locale);
  const redirectHref = withLocalePath(redirectUrl, locale);

  // Fallback au cas où (mais normalement inutile si messages OK)
  const fallback = {
    title: isFR ? 'Se déconnecter' : 'Log out',
    question: isFR
      ? 'Voulez-vous vraiment vous déconnecter ?'
      : 'Are you sure you want to log out?',
    confirm: isFR ? 'Confirmer' : 'Confirm',
    cancel: isFR ? 'Annuler' : 'Cancel',
  };

  return (
    <>
      <div className="fixed top-4 right-8 z-50">
        <LocaleSwitcher />
      </div>

      <div className="max-w-md mx-auto p-8">
        <h1 className="text-xl font-semibold mb-2">
          {title || fallback.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {question || fallback.question}
        </p>

        <div className="flex items-center gap-3">
          <SignOutButton signOutOptions={{ redirectUrl: redirectHref }}>
            <button className="px-4 py-2 rounded bg-black text-white">
              {confirm || fallback.confirm}
            </button>
          </SignOutButton>

          <Link
            href={cancelHref}
            className="px-4 py-2 rounded border hover:bg-muted transition"
          >
            {cancel || fallback.cancel}
          </Link>
        </div>
      </div>
    </>
  );
}
