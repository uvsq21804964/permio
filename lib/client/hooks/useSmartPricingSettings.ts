'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import type { SmartPricingMode, SmartPricingParams } from '@/lib/pricing/smartSlotPricing';
import {
  getMySmartPricingSettings,
  updateMySmartPricingSettings,
} from '@/lib/client/api/smart-pricing-client';

type SmartPricingFormState = {
  enabled: boolean;
  mode: SmartPricingMode;
  trainerHourlyValueEuros: string;
  costPerKmEuros: string;
  passThroughRatePct: string;
  maxDiscountPct: string;
  maxSurchargePct: string;
  roundToNearestEuros: string;
};

function formatEurosFromCents(value: number) {
  const euros = value / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2);
}

function formatPercent(value: number) {
  return String(Math.round(value * 1000) / 10).replace(/\.0$/, '');
}

function toFormState(settings: SmartPricingParams): SmartPricingFormState {
  return {
    enabled: settings.enabled,
    mode: settings.mode,
    trainerHourlyValueEuros: formatEurosFromCents(settings.trainerHourlyValueCents),
    costPerKmEuros: formatEurosFromCents(settings.costPerKmCents),
    passThroughRatePct: formatPercent(settings.passThroughRate),
    maxDiscountPct: formatPercent(settings.maxDiscountPct),
    maxSurchargePct: formatPercent(settings.maxSurchargePct),
    roundToNearestEuros: formatEurosFromCents(settings.roundToNearestCents),
  };
}

function toCents(value: string) {
  return Math.round(Number(value) * 100);
}

function toRatio(value: string) {
  return Number(value) / 100;
}

export function useSmartPricingSettings(options: { enabled: boolean }) {
  const t = useTranslations('profile');
  const [settings, setSettings] = useState<SmartPricingParams | null>(null);
  const [form, setForm] = useState<SmartPricingFormState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!options.enabled) {
      setSettings(null);
      setForm(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getMySmartPricingSettings({
        fallbackMessage: t('smartPricing.errors.load'),
      });
      setSettings(response.settings);
      setForm(toFormState(response.settings));
    } catch (nextError: any) {
      console.error(nextError);
      setError(nextError?.message || t('smartPricing.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [options.enabled, t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const updateField = useCallback(
    <K extends keyof SmartPricingFormState>(field: K, value: SmartPricingFormState[K]) => {
      setForm((current) => (current ? { ...current, [field]: value } : current));
    },
    [],
  );

  const validationError = useMemo(() => {
    if (!form) return null;

    const hourly = Number(form.trainerHourlyValueEuros);
    const km = Number(form.costPerKmEuros);
    const passThrough = Number(form.passThroughRatePct);
    const maxDiscount = Number(form.maxDiscountPct);
    const maxSurcharge = Number(form.maxSurchargePct);
    const roundTo = Number(form.roundToNearestEuros);

    if (!Number.isFinite(hourly) || hourly < 0) {
      return t('smartPricing.errors.invalidHourlyValue');
    }

    if (!Number.isFinite(km) || km < 0) {
      return t('smartPricing.errors.invalidKmCost');
    }

    if (!Number.isFinite(passThrough) || passThrough < 0 || passThrough > 100) {
      return t('smartPricing.errors.invalidPassThrough');
    }

    if (!Number.isFinite(maxDiscount) || maxDiscount < 0 || maxDiscount > 100) {
      return t('smartPricing.errors.invalidMaxDiscount');
    }

    if (!Number.isFinite(maxSurcharge) || maxSurcharge < 0 || maxSurcharge > 100) {
      return t('smartPricing.errors.invalidMaxSurcharge');
    }

    if (!Number.isFinite(roundTo) || roundTo <= 0) {
      return t('smartPricing.errors.invalidRounding');
    }

    return null;
  }, [form, t]);

  const save = useCallback(async () => {
    if (!form || validationError) {
      setError(validationError ?? t('smartPricing.errors.load'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await updateMySmartPricingSettings(
        {
          enabled: form.enabled,
          mode: form.mode,
          trainerHourlyValueCents: toCents(form.trainerHourlyValueEuros),
          costPerKmCents: toCents(form.costPerKmEuros),
          passThroughRate: toRatio(form.passThroughRatePct),
          maxDiscountPct: toRatio(form.maxDiscountPct),
          maxSurchargePct: toRatio(form.maxSurchargePct),
          roundToNearestCents: toCents(form.roundToNearestEuros),
        },
        {
          fallbackMessage: t('smartPricing.errors.save'),
        },
      );

      setSettings(response.settings);
      setForm(toFormState(response.settings));
      toast.success(t('smartPricing.success.saved'));
    } catch (nextError: any) {
      console.error(nextError);
      setError(nextError?.message || t('smartPricing.errors.save'));
    } finally {
      setSaving(false);
    }
  }, [form, t, validationError]);

  return {
    error,
    form,
    loading,
    save,
    saving,
    settings,
    updateField,
    validationError,
  };
}
