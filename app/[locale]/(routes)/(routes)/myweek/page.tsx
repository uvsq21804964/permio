// app/(votre-seg)/my-week/page.tsx
import LastWeekAgenda from '@/components/schedule/LastWeekAgenda';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function MyWeekPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm text-red-600">
            Vous devez être connecté pour voir votre agenda.
          </p>
        </div>
      </div>
    );
  }

  try {
    // Optionnel : tu peux utiliser 'role' si besoin pour de l’affichage conditionnel
    const rows =
      await sql`SELECT role FROM "User" WHERE id = ${userId} LIMIT 1`;
    // const role = rows?.[0]?.role ?? null;
  } catch (e) {
    console.error('[my-week] error fetching role:', e);
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Affiche la dernière semaine pour l'utilisateur courant */}
        <LastWeekAgenda userId={userId} />
      </div>
    </div>
  );
}
