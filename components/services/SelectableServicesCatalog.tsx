import type { ServiceCategory, ServicePricing } from '@/lib/client/api/services-client';

type ServicesTranslate = (key: string) => string;

type SelectableServicesCatalogProps = {
  categories: ServiceCategory[];
  services: ServicePricing[];
  locale: string;
  onSelectService: (service: ServicePricing) => void;
  t: ServicesTranslate;
};

function formatPrice(price: number | string, locale: string): string {
  const num = Number(price);
  const isFr = locale === 'fr' || locale.startsWith('fr');
  const currency = isFr ? 'EUR' : 'USD';

  if (Number.isNaN(num)) {
    return isFr ? `${price} €` : `$${price}`;
  }

  try {
    return new Intl.NumberFormat(isFr ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency,
    }).format(num);
  } catch {
    const fixed = num.toFixed(2);
    return isFr ? `${fixed} €` : `$${fixed}`;
  }
}

export function SelectableServicesCatalog({
  categories,
  services,
  locale,
  onSelectService,
  t,
}: SelectableServicesCatalogProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const categoryServices = services.filter(
          (service) => service.category_id === category.id,
        );

        return (
          <section
            key={category.id}
            className="rounded-2xl border bg-card p-4 md:p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold break-words">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {category.description}
                  </p>
                )}
              </div>
            </div>

            {categoryServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('category.noServices')}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {categoryServices.map((service) => {
                  const priceLabel = formatPrice(service.price, locale);

                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => onSelectService(service)}
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
  );
}
