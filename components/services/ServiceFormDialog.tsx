import type { ChangeEvent, FormEvent } from 'react';

import type { ServiceCategory } from '@/lib/client/api/services-client';

type ServicesTranslate = (key: string) => string;

export type ServiceDraft = {
  id: number | null;
  categoryId: number;
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
  includes_transport: boolean;
  is_remote: boolean;
};

type ServiceModalMode = 'create' | 'edit';

type ServiceFormDialogProps = {
  open: boolean;
  mode: ServiceModalMode;
  draft: ServiceDraft | null;
  categories: ServiceCategory[];
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: ServicesTranslate;
};

export function ServiceFormDialog({
  open,
  mode,
  draft,
  categories,
  saving,
  formError,
  onClose,
  onChange,
  onSubmit,
  t,
}: ServiceFormDialogProps) {
  if (!open || !draft) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            {mode === 'create' ? t('service.createTitle') : t('service.editTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('buttons.close')}
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <label
              htmlFor="categoryId"
              className="text-xs font-medium text-foreground"
            >
              {t('service.categoryLabel')}
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={draft.categoryId}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value={0}>{t('service.categoryPlaceholder')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="name" className="text-xs font-medium text-foreground">
              {t('service.nameLabel')}
            </label>
            <input
              id="name"
              name="name"
              value={draft.name}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="text-xs font-medium text-foreground"
            >
              {t('service.descriptionLabel')}
            </label>
            <textarea
              id="description"
              name="description"
              value={draft.description}
              onChange={onChange}
              rows={4}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <label
                htmlFor="duration_minutes"
                className="text-xs font-medium text-foreground"
              >
                {t('service.durationLabel')}
              </label>
              <input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={0}
                step={5}
                value={draft.duration_minutes}
                onChange={onChange}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder={t('service.durationPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="price"
                className="text-xs font-medium text-foreground"
              >
                {t('service.priceLabel')}
              </label>
              <input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                value={draft.price}
                onChange={onChange}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder={t('service.pricePlaceholder')}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                <input
                  type="checkbox"
                  name="is_remote"
                  checked={draft.is_remote}
                  onChange={onChange}
                  className="rounded border"
                />
                {t('service.remoteLabel')}
              </label>

              {!draft.is_remote && (
                <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                  <input
                    type="checkbox"
                    name="includes_transport"
                    checked={draft.includes_transport}
                    onChange={onChange}
                    className="rounded border"
                  />
                  {t('service.includesTransportLabel')}
                </label>
              )}
            </div>
          </div>

          {formError && <p className="text-xs text-red-600">{formError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? t('buttons.saving')
                : mode === 'create'
                  ? t('buttons.create')
                  : t('buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
