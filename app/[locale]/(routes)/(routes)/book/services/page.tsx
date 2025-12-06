// app/[locale]/(routes)/(routes)/book/services/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
};

type ApiResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

export default function SelectServicePage() {
  const router = useRouter();

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
          throw new Error(
            data.error ||
              'Impossible de récupérer les services de votre moniteur.'
          );
        }
        const data: ApiResponse = await res.json();
        setCategories(data.categories || []);
        setServices(data.services || []);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ||
            'Erreur lors du chargement des services de votre moniteur.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSelectService = (service: ServicePricing) => {
    const params = new URLSearchParams({
      serviceId: String(service.id),
    });

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
              Choisir un type de service
            </h1>
            <p className="text-xs text-muted-foreground">
              Sélectionnez le service que vous souhaitez réserver avant de
              choisir un créneau dans l’agenda.
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
            Votre moniteur n’a pas encore configuré de services.
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
                    Aucun service disponible dans cette catégorie pour
                    l’instant.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {catServices.map((service) => {
                      const priceNum = Number(service.price);
                      const priceLabel = Number.isNaN(priceNum)
                        ? `${service.price} €`
                        : `${priceNum.toFixed(2)} €`;

                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => handleSelectService(service)}
                          className="text-left rounded-xl border bg-background p-3 flex flex-col justify-between hover:border-primary hover:shadow-sm transition"
                        >
                          <div className="space-y-1">
                            <h3 className="text-sm font-semibold break-words">
                              {service.name}
                            </h3>
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
                              Choisir ce service
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
