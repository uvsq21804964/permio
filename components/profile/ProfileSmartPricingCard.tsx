'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProfileTranslator } from '@/components/profile/profile-shared';
import type { SmartPricingMode } from '@/lib/pricing/smartSlotPricing';

type ProfileSmartPricingCardProps = {
  error: string | null;
  form: {
    enabled: boolean;
    mode: SmartPricingMode;
    trainerHourlyValueEuros: string;
    costPerKmEuros: string;
    passThroughRatePct: string;
    maxDiscountPct: string;
    maxSurchargePct: string;
    roundToNearestEuros: string;
  } | null;
  loading: boolean;
  onSave: () => void;
  saving: boolean;
  t: ProfileTranslator;
  updateField: (
    field:
      | 'enabled'
      | 'mode'
      | 'trainerHourlyValueEuros'
      | 'costPerKmEuros'
      | 'passThroughRatePct'
      | 'maxDiscountPct'
      | 'maxSurchargePct'
      | 'roundToNearestEuros',
    value: string | boolean,
  ) => void;
  validationError: string | null;
};

export function ProfileSmartPricingCard({
  error,
  form,
  loading,
  onSave,
  saving,
  t,
  updateField,
  validationError,
}: ProfileSmartPricingCardProps) {
  if (loading) {
    return (
      <section className="rounded-2xl border bg-card p-5 shadow-sm animate-pulse space-y-3">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="h-4 w-72 rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-2">
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
      </section>
    );
  }

  if (!form) {
    return null;
  }

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">{t('smartPricing.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('smartPricing.subtitle')}</p>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl border bg-black/[0.02] px-4 py-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{t('smartPricing.enabled.label')}</p>
          <p className="text-xs text-muted-foreground">
            {t('smartPricing.enabled.help')}
          </p>
        </div>
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => updateField('enabled', event.target.checked)}
          className="h-4 w-4 accent-black"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.mode')}
          </label>
          <select
            value={form.mode}
            onChange={(event) =>
              updateField('mode', event.target.value as SmartPricingMode)
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="rank_only">{t('smartPricing.modes.rank_only')}</option>
            <option value="discount_only">{t('smartPricing.modes.discount_only')}</option>
            <option value="discount_and_surcharge">
              {t('smartPricing.modes.discount_and_surcharge')}
            </option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.roundToNearest')}
          </label>
          <Input
            type="number"
            min="0.5"
            step="0.5"
            value={form.roundToNearestEuros}
            onChange={(event) =>
              updateField('roundToNearestEuros', event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.trainerHourlyValue')}
          </label>
          <Input
            type="number"
            min="0"
            step="1"
            value={form.trainerHourlyValueEuros}
            onChange={(event) =>
              updateField('trainerHourlyValueEuros', event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.costPerKm')}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.costPerKmEuros}
            onChange={(event) => updateField('costPerKmEuros', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.passThroughRate')}
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.passThroughRatePct}
            onChange={(event) =>
              updateField('passThroughRatePct', event.target.value)
            }
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.maxDiscount')}
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.maxDiscountPct}
            onChange={(event) => updateField('maxDiscountPct', event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">
            {t('smartPricing.fields.maxSurcharge')}
          </label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            value={form.maxSurchargePct}
            onChange={(event) => updateField('maxSurchargePct', event.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{t('smartPricing.advancedNote')}</p>

      {validationError ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {validationError}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={saving || Boolean(validationError)}>
          {saving ? t('smartPricing.actions.saving') : t('smartPricing.actions.save')}
        </Button>
      </div>
    </section>
  );
}
