// app/[locale]/(routes)/(routes)/gestion/page.tsx

import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import UserManagement from '@/components/gestion/UserManagement';

type Props = {
  params: { locale: string };
};

export default async function GestionPage({ params }: Props) {
  const { locale } = params;

  const { userId, orgId } = await auth();
  if (!userId) redirect(`/${locale}/sign-in`);
  if (!orgId) redirect(`/${locale}`);

  const me = await sql`
    SELECT role FROM "User"
    CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _
    WHERE id = ${userId} LIMIT 1
  `;

  const meRole = me[0]?.role ?? null;

  if (!meRole) return null;
  if (meRole !== 'instructor' && meRole !== 'admin') {
    redirect(`/${locale}/myavailabilities`);
  }

  return (
    <UserManagement meRole={meRole as 'student' | 'instructor' | 'admin'} />
  );
}
