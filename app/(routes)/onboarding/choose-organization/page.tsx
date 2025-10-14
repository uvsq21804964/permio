// app/onboarding/choose-organization/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from '@clerk/nextjs/server';
import { AssociateAgency } from '@/components/associate-agency';

type SearchParams = {
  redirect_url?: string | string[];
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams; // Next 14/15: async
  const hdrs = await headers(); // Next 14/15: async
  const { userId, orgId } = getAuth(
    { headers: hdrs },
    { treatPendingAsSignedOut: false } // ✅ clé anti-boucle
  );

  // Pas de session → laisse Clerk ramener l'utilisateur sur /sign-in
  if (!userId) {
    redirect('/sign-in');
  }

  // Cible finale (si absente → /agenda)
  const rawTarget = Array.isArray(sp?.redirect_url)
    ? sp.redirect_url[0]
    : sp?.redirect_url;
  const target = (() => {
    const v = rawTarget ?? '/agenda';
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  })();

  // Si une organisation est déjà active, on peut sortir tout de suite
  if (orgId) {
    redirect(target);
  }

  // Sinon on affiche TON composant qui va:
  //  - POST /api/agency/association (ajoute le membership)
  //  - setActive({ organization: <id> })
  //  - router.refresh() → ce composant se re-rendera, verra orgId et redirigera
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold mb-3">Associer votre agence</h1>
      <p className="text-sm text-gray-600 mb-4">
        Saisissez le code agence pour rejoindre votre organisation.
      </p>
      <AssociateAgency className="mt-2" />
      {/* Optionnel: lien de secours */}
      {/* <p className="mt-6 text-sm text-gray-500">Problème ? <a href="/support" className="underline">Contactez-nous</a>.</p> */}
    </main>
  );
}
