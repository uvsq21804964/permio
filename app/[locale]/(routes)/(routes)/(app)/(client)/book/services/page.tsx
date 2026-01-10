// app/[locale]/(routes)/(routes)/book/services/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

type ServicePricing = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | string;
  includes_transport: boolean;
  is_remote: boolean; // ✅
};

type ApiResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

// Format prix localisé (EUR en FR, USD en EN)
function formatPrice(price: number | string, locale: string): string {
  const num = Number(price);
  const isFr = locale === 'fr' || locale.startsWith('fr');
  const currency = isFr ? 'EUR' : 'USD';

  if (Number.isNaN(num)) return isFr ? `${price} €` : `$${price}`;

  try {
    // ✅ Intl gère automatiquement le symbole (€ / $) selon la devise
    return new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(num);
  } catch {
    // fallback simple si Intl casse
    const fixed = num.toFixed(2);
    return isFr ? `${fixed} €` : `$${fixed}`;
  }
}

export default function SelectServicePage() {
  const router = useRouter();
  const t = useTranslations('bookServices');
  const locale = useLocale();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/me/instructor-services', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || t('errors.loadServicesApi'));
        }
        const data: ApiResponse = await res.json();
        setCategories(data.categories || []);
        setServices(data.services || []);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || t('errors.loadServicesGeneric'));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [t]);

  const handleSelectService = (service: ServicePricing) => {
    const params = new URLSearchParams({
      serviceId: String(service.id),
    });

    // ✅ Remote => skip address
    if (service.is_remote) {
      router.push(`/book/proposals?${params.toString()}`);
      return;
    }

    // Sinon => adresse obligatoire
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

        {/* Catégories + services (lecture seule) */}
        <div className="space-y-6">
          {categories.map((cat) => {
            const catServices = services.filter(
              (s) => s.category_id === cat.id
            );

            return (
              <section
                key={cat.id}
                className="rounded-2xl border bg-card p-4 md:p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold break-words">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </div>

                {catServices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t('category.noServices')}
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {catServices.map((service) => {
                      const priceLabel = formatPrice(service.price, locale);

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleSelectService(service)}
                          className="text-left rounded-xl border bg-background p-3 flex flex-col justify-between hover:border-primary hover:shadow-sm transition"
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold break-words">
                                {service.name}
                              </h3>

                              {service.is_remote ? (
                                <span className="inline-flex items-center rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                                  {t('badges.remote')}
                                </span>
                              ) : service.includes_transport ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                                  {t('badges.transportIncluded')}
                                </span>
                              ) : null}
                            </div>

                            {service.description && (
                              <p className="text-xs text-muted-foreground whitespace-pre-line">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-col">
                              <span className="font-medium">{priceLabel}</span>
                              {service.duration_minutes != null && (
                                <span className="text-muted-foreground">
                                  {service.duration_minutes} min
                                </span>
                              )}
                            </div>
                            <span className="inline-flex items-center rounded-full bg-primary/5 border border-primary/20 px-2 py-0.5 text-[11px] text-primary">
                              {t('button.chooseService')}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
