import type { ServiceCategory, ServicePricing } from '@/lib/client/api/services-client';

type ServicesTranslate = (key: string) => string;

type EditableServicesCatalogProps = {
  categories: ServiceCategory[];
  services: ServicePricing[];
  onAddService: (categoryId?: number) => void;
  onEditService: (service: ServicePricing) => void;
  onDeleteService: (service: ServicePricing) => void;
  onDeleteCategory: (category: ServiceCategory) => void;
  t: ServicesTranslate;
};

export function EditableServicesCatalog({
  categories,
  services,
  onAddService,
  onEditService,
  onDeleteService,
  onDeleteCategory,
  t,
}: EditableServicesCatalogProps) {
  return (
    <div className="space-y-6">
      {categories.length === 0 && (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          {t('empty.noCategoryOrService')}
        </div>
      )}

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
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => onAddService(category.id)}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 whitespace-nowrap shrink-0"
                >
                  + {t('buttons.addService')}
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteCategory(category)}
                  className="inline-flex items-center justify-center rounded-full border border-red-300 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0"
                >
                  {t('buttons.delete')}
                </button>
              </div>
            </div>

            {categoryServices.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                {t('empty.noServiceInCategory')}
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {categoryServices.map((service) => {
                  const priceNum = Number(service.price);
                  const priceLabel = Number.isNaN(priceNum)
                    ? `${service.price} $`
                    : `${priceNum.toFixed(2)} $`;

                  return (
                    <div
                      key={service.id}
                      className="rounded-xl border bg-background p-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
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
                          </div>

                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditService(service)}
                              className="inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 whitespace-nowrap shrink-0"
                            >
                              {t('buttons.edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteService(service)}
                              className="inline-flex items-center justify-center rounded-full border border-red-300 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0"
                            >
                              {t('buttons.delete')}
                            </button>
                          </div>
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
                      </div>
                    </div>
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
