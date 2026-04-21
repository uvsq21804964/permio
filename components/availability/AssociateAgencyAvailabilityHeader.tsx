'use client';

import { Button } from '@/components/ui/button';

type AssociateAgencyAvailabilityHeaderProps = {
  dirty: boolean;
  locale: string;
  onboarding: boolean;
  onReset: () => void;
  onSave: () => void;
  saving: boolean;
};

export function AssociateAgencyAvailabilityHeader({
  dirty,
  locale,
  onboarding,
  onReset,
  onSave,
  saving,
}: AssociateAgencyAvailabilityHeaderProps) {
  const isFrench = locale.startsWith('fr');

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-base font-semibold text-black md:text-lg">
          {isFrench ? 'Vos disponibilités' : 'Your availability'}
        </div>
        <div className="text-sm text-black/55">
          {isFrench
            ? 'Cliquez dans la grille pour ajouter des plages.'
            : 'Click in the grid to add time ranges.'}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!onboarding && dirty ? (
          <span className="whitespace-nowrap text-xs text-black/50">
            {isFrench ? 'Modifications non enregistrees' : 'Unsaved changes'}
          </span>
        ) : null}

        {!onboarding && dirty ? (
          <Button type="button" variant="outline" onClick={onReset} disabled={saving}>
            {isFrench ? 'Annuler' : 'Reset'}
          </Button>
        ) : null}

        <Button type="button" onClick={onSave} disabled={saving || (!onboarding && !dirty)}>
          {saving
            ? isFrench
              ? 'Validation...'
              : 'Saving...'
            : isFrench
            ? 'Valider'
            : 'Save'}
        </Button>
      </div>
    </div>
  );
}
