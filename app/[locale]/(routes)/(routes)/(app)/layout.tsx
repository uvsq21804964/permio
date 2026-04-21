import { ReactNode } from 'react';
import { requirePaidSubscriptionForAgency } from '@/src/lib/require-subscription-if-educator';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  await requirePaidSubscriptionForAgency(locale);
  return <>{children}</>;
}
