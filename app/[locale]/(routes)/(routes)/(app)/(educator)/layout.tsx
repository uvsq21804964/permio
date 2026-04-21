import { requireRole } from '@/src/lib/require-role';
import { requirePaidSubscriptionForAgency } from '@/src/lib/require-subscription-if-educator';
import type { Locale } from '@/src/lib/i18n';

export default async function EducatorAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  await requireRole(['instructor'], '/', locale);
  await requirePaidSubscriptionForAgency(locale);
  return <>{children}</>;
}
