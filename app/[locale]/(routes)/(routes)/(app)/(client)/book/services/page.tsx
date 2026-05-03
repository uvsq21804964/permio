'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { SelectableServicesCatalog } from '@/components/services/SelectableServicesCatalog';
import { trackButtonClick } from '@/lib/client/button-tracking';
import { useInstructorServices } from '@/lib/client/hooks/useInstructorServices';
import type { ServicePricing } from '@/lib/client/api/services-client';

export default function SelectServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('bookServices');
  const locale = useLocale();
  const clientUserId = searchParams.get('clientUserId');

  const { categories, services, loading, error } = useInstructorServices({
    loadErrorMessage: t('errors.loadServicesApi'),
  });

  const handleSelectService = (service: ServicePricing) => {
    const params = new URLSearchParams({
      serviceId: String(service.id),
    });
    if (clientUserId) {
      params.set('clientUserId', clientUserId);
    }
    const targetHref = service.is_remote
      ? `/book/proposals?${params.toString()}`
      : `/book/address?${params.toString()}`;

    trackButtonClick({
      buttonKey: 'booking_select_service',
      buttonLabel: service.name,
      buttonContext: 'booking_services',
      targetHref,
      locale,
      metadata: {
        serviceId: service.id,
        isRemote: Boolean(service.is_remote),
        price: service.price,
        durationMinutes: service.duration_minutes,
      },
    });

    if (service.is_remote) {
      router.push(`/book/proposals?${params.toString()}`);
      return;
    }

    router.push(`/book/address?${params.toString()}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-semibold">
              {t('header.title')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('header.subtitle')}
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
            {error}
          </div>
        )}

        {!error && categories.length === 0 && (
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            {t('empty.noServices')}
          </div>
        )}

        <SelectableServicesCatalog
          categories={categories}
          services={services}
          locale={locale}
          onSelectService={handleSelectService}
          t={t}
        />
      </div>
    </main>
  );
}
