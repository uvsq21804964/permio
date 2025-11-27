// app/[locale]/sign-out/[[...sign-out]]/SignOutClient.tsx
'use client';

import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
// Si LocaleSwitcher ou LocaleLink utilisent next-intl/useLocale, on les évite ici
// pour ne pas recréer le problème de contexte.

type Props = {
  title: string;
  question: string;
  confirm: string;
  cancel: string;
  redirectUrl: string;
  cancelUrl: string;
};

export default function SignOutClient({
  title,
  question,
  confirm,
  cancel,
  redirectUrl,
  cancelUrl,
}: Props) {
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-xl font-semibold mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-6">{question}</p>

      <div className="flex items-center gap-3">
        <SignOutButton signOutOptions={{ redirectUrl }}>
          <button className="px-4 py-2 rounded bg-black text-white">
            {confirm}
          </button>
        </SignOutButton>

        <Link
          href={cancelUrl}
          className="px-4 py-2 rounded border hover:bg-muted transition"
        >
          {cancel}
        </Link>
      </div>
    </div>
  );
}
