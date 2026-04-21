import { ReactNode } from 'react';
import { requireRole } from '@/src/lib/require-role';
import type { Locale } from '@/src/lib/i18n';

export default async function ClientAppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requireRole(['student'], '/', locale);
  return <>{children}</>;
}
