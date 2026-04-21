import type { FormEvent } from 'react';

import type { ProfileTranslator } from '@/components/profile/profile-shared';

type ProfileNameModalProps = {
  draftName: string;
  error: string | null;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  open: boolean;
  saving: boolean;
  t: ProfileTranslator;
};

export function ProfileNameModal({
  draftName,
  error,
  onChange,
  onClose,
  onSubmit,
  open,
  saving,
  t,
}: ProfileNameModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-card border shadow-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('modals.name.title')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {t('common.close')}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{t('modals.name.helper')}</p>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="new_name" className="text-xs font-medium text-foreground">
              {t('modals.name.newName')}
            </label>
            <input
              id="new_name"
              value={draftName}
              onChange={(event) => onChange(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
              autoFocus
            />
          </div>

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
