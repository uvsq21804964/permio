import { ReactNode } from 'react';
import { requirePaidSubscriptionForAgency } from '@/src/lib/require-subscription-if-educator';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  await requirePaidSubscriptionForAgency(params.locale);
  return <>{children}</>;
}
