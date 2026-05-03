import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { requireRole } from '@/src/lib/require-role';
import { requirePaidSubscriptionForAgency } from '@/src/lib/require-subscription-if-educator';
import type { Locale } from '@/src/lib/i18n';

export default async function ClientAppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requireRole(['student', 'instructor'], '/', locale);

  const { userId } = await auth();
  const rows = userId
    ? await sql`SELECT role FROM "User" WHERE id = ${userId} LIMIT 1`
    : [];
  if (rows[0]?.role === 'instructor') {
    await requirePaidSubscriptionForAgency(locale);
  }

  return <>{children}</>;
}
