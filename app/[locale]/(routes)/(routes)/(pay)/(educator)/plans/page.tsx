'use client';

import Comparison from '@/components/home/Comparison';
import FAQ from '@/components/home/FAQ';
import Plans from '@/components/home/PlansSansSimulation';
import CompetitorComparison from '@/components/home/PropositionValeur';
import React, { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function HomePage() {
  const t = useTranslations('plansPage'); // <-- choisis le namespace que tu veux (voir traductions plus bas)
  const locale = useLocale();

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const toastShownRef = useRef(false);

  useEffect(() => {
    const required = searchParams.get('reason') === 'subscription';
    if (!required) return;
    if (toastShownRef.current) return;
    toastShownRef.current = true;

    toast.error(t('toasts.subscriptionRequired.title'), {
      description: t('toasts.subscriptionRequired.description'),
    });

    // Retire le param pour éviter que le toast revienne au refresh
    const params = new URLSearchParams(searchParams.toString());
    params.delete('reason');
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(nextUrl, { scroll: false });
  }, [searchParams, router, pathname, t]);

  return (
    <div className="bg-[#f9ffc6]/80">
      <Plans withTrial={false} />
      <Comparison />
      <FAQ />
      <CompetitorComparison />
    </div>
  );
}
