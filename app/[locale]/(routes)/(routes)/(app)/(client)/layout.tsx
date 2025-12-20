import { ReactNode } from 'react';
import { requireRole } from '@/src/lib/require-role';

export default async function ClientAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(['student'], '/');
  return <>{children}</>;
}
