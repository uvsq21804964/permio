import type { ChangeEvent, FormEvent } from 'react';

type ServicesTranslate = (key: string) => string;

export type CategoryDraft = {
  name: string;
  description: string;
};

type CategoryFormDialogProps = {
  open: boolean;
  draft: CategoryDraft;
  saving: boolean;
  formError: string | null;
  onClose: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  t: ServicesTranslate;
};

export function CategoryFormDialog({
  open,
  draft,
  saving,
  formError,
  onClose,
  onChange,
  onSubmit,
  t,
}: CategoryFormDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('category.createTitle')}</h2>
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
              htmlFor="cat_name"
              className="text-xs font-medium text-foreground"
            >
              {t('category.nameLabel')}
            </label>
            <input
              id="cat_name"
              name="name"
              value={draft.name}
              onChange={onChange}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="cat_description"
              className="text-xs font-medium text-foreground"
            >
              {t('category.descriptionLabel')}
            </label>
            <textarea
              id="cat_description"
              name="description"
              value={draft.description}
              onChange={onChange}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
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
              {saving ? t('buttons.creating') : t('buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
