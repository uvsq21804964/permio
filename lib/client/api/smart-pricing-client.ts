import { requestJson } from '@/lib/client/api/request';
import type { SmartPricingMode, SmartPricingParams } from '@/lib/pricing/smartSlotPricing';

type SmartPricingErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

export type SmartPricingSettingsResponse = {
  settings: SmartPricingParams;
};

export type SmartPricingSettingsUpdatePayload = {
  enabled: boolean;
  mode: SmartPricingMode;
  trainerHourlyValueCents: number;
  costPerKmCents: number;
  passThroughRate: number;
  maxDiscountPct: number;
  maxSurchargePct: number;
  roundToNearestCents: number;
};

export function getMySmartPricingSettings(options?: { fallbackMessage?: string }) {
  return requestJson<SmartPricingSettingsResponse, SmartPricingErrorBody>(
    '/api/me/smart-pricing',
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to load smart pricing settings',
    },
  );
}

export function updateMySmartPricingSettings(
  payload: SmartPricingSettingsUpdatePayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true; settings: SmartPricingParams }, SmartPricingErrorBody>(
    '/api/me/smart-pricing',
    {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify(payload),
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to update smart pricing settings',
    },
  );
}
