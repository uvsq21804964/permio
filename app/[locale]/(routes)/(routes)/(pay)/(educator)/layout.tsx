import { ReactNode } from 'react';
import { requireRole } from '@/src/lib/require-role';

export default async function EducatorPayLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireRole(['instructor'], '/');
  return <>{children}</>;
}
