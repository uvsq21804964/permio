import { requireRole } from '@/src/lib/require-role';
import { requirePaidSubscriptionForAgency } from '@/src/lib/require-subscription-if-educator';

export default async function EducatorAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  await requireRole(['instructor'], '/'); // bloque si pas instructor
  await requirePaidSubscriptionForAgency(params.locale);
  return <>{children}</>;
}
