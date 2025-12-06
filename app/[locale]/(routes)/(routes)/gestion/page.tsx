// app/gestion/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import UserManagement from '@/components/gestion/UserManagement';

export default async function GestionPage() {
  const { userId, orgId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!orgId) redirect('/');

  const me = await sql`
    SELECT role FROM "User"
    CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _
    WHERE id = ${userId} LIMIT 1
  `;

  const meRole = me[0]?.role ?? null;

  if (!meRole) return null;
  if (meRole !== 'instructor' && meRole !== 'admin') {
    redirect('/myavailabilities');
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Gestion des utilisateurs</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Contacter l'un de vos clients par mail.
      </p>
      <UserManagement meRole={meRole as 'student' | 'instructor' | 'admin'} />
    </div>
  );
}
