// app/sign-out/[[...sign-out]]/page.tsx
'use client';

import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignOutPage() {
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-xl font-semibold mb-2">Se déconnecter</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Voulez-vous vraiment vous déconnecter ?
      </p>

      <div className="flex items-center gap-3">
        <SignOutButton signOutOptions={{ redirectUrl: '/sign-in' }}>
          <button className="px-4 py-2 rounded bg-black text-white">
            Oui, me déconnecter
          </button>
        </SignOutButton>

        <Link
          href="/agenda"
          className="px-4 py-2 rounded border hover:bg-muted transition"
        >
          Annuler
        </Link>
      </div>
    </div>
  );
}
