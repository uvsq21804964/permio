import { DEFAULT_SMART_PRICING_PARAMS } from '@/lib/pricing/defaultSmartPricingParams';
import type {
  SmartPricingMode,
  SmartPricingParams,
} from '@/lib/pricing/smartSlotPricing';
import { getSmartPricingSettingsRow } from '@/lib/server/repositories/smart-pricing-settings-repository';

type SmartPricingSettingsOverrides = Partial<
  Omit<SmartPricingParams, 'weights' | 'thresholds'>
> & {
  weights?: Partial<SmartPricingParams['weights']> | null;
  thresholds?: Partial<SmartPricingParams['thresholds']> | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown, fallback: number) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNonNegativeNumber(value: unknown, fallback: number) {
  return Math.max(0, toFiniteNumber(value, fallback));
}

function toRatio(value: unknown, fallback: number) {
  return Math.min(1, Math.max(0, toFiniteNumber(value, fallback)));
}

function toMode(value: unknown, fallback: SmartPricingMode): SmartPricingMode {
  return value === 'rank_only' ||
    value === 'discount_only' ||
    value === 'discount_and_surcharge'
    ? value
    : fallback;
}

export function mergeSmartPricingParams(
  overrides?: SmartPricingSettingsOverrides | null,
): SmartPricingParams {
  const defaults = DEFAULT_SMART_PRICING_PARAMS;

  const weights = isRecord(overrides?.weights) ? overrides?.weights : null;
  const thresholds = isRecord(overrides?.thresholds) ? overrides?.thresholds : null;

  return {
    enabled:
      typeof overrides?.enabled === 'boolean'
        ? overrides.enabled
        : defaults.enabled,
    mode: toMode(overrides?.mode, defaults.mode),
    trainerHourlyValueCents: Math.round(
      toNonNegativeNumber(
        overrides?.trainerHourlyValueCents,
        defaults.trainerHourlyValueCents,
      ),
    ),
    costPerKmCents: Math.round(
      toNonNegativeNumber(overrides?.costPerKmCents, defaults.costPerKmCents),
    ),
    passThroughRate: toRatio(overrides?.passThroughRate, defaults.passThroughRate),
    maxDiscountPct: toRatio(overrides?.maxDiscountPct, defaults.maxDiscountPct),
    maxSurchargePct: toRatio(overrides?.maxSurchargePct, defaults.maxSurchargePct),
    maxDiscountCents:
      overrides?.maxDiscountCents == null
        ? defaults.maxDiscountCents
        : Math.round(
            toNonNegativeNumber(
              overrides.maxDiscountCents,
              defaults.maxDiscountCents ?? 0,
            ),
          ),
    maxSurchargeCents:
      overrides?.maxSurchargeCents == null
        ? defaults.maxSurchargeCents
        : Math.round(
            toNonNegativeNumber(
              overrides.maxSurchargeCents,
              defaults.maxSurchargeCents ?? 0,
            ),
          ),
    neutralZonePct: toRatio(overrides?.neutralZonePct, defaults.neutralZonePct),
    roundToNearestCents: Math.max(
      1,
      Math.round(
        toNonNegativeNumber(
          overrides?.roundToNearestCents,
          defaults.roundToNearestCents,
        ),
      ),
    ),
    hideIfImpactAboveCents: Math.round(
      toNonNegativeNumber(
        overrides?.hideIfImpactAboveCents,
        defaults.hideIfImpactAboveCents,
      ),
    ),
    availableOnRequestIfImpactAboveCents: Math.round(
      toNonNegativeNumber(
        overrides?.availableOnRequestIfImpactAboveCents,
        defaults.availableOnRequestIfImpactAboveCents,
      ),
    ),
    wasteFactor: toNonNegativeNumber(overrides?.wasteFactor, defaults.wasteFactor),
    weights: {
      marginalTravel: toNonNegativeNumber(
        weights?.marginalTravel,
        defaults.weights.marginalTravel,
      ),
      wastedGap: toNonNegativeNumber(weights?.wastedGap, defaults.weights.wastedGap),
      routeDisruption: toNonNegativeNumber(
        weights?.routeDisruption,
        defaults.weights.routeDisruption,
      ),
      opportunity: toNonNegativeNumber(
        weights?.opportunity,
        defaults.weights.opportunity,
      ),
      bufferRisk: toNonNegativeNumber(
        weights?.bufferRisk,
        defaults.weights.bufferRisk,
      ),
      endOfDayHomeDistance: toNonNegativeNumber(
        weights?.endOfDayHomeDistance,
        defaults.weights.endOfDayHomeDistance,
      ),
      clusterBenefit: toNonNegativeNumber(
        weights?.clusterBenefit,
        defaults.weights.clusterBenefit,
      ),
      recurringClientBonus: toNonNegativeNumber(
        weights?.recurringClientBonus,
        defaults.weights.recurringClientBonus,
      ),
      weather: toNonNegativeNumber(weights?.weather, defaults.weights.weather),
      fatigue: toNonNegativeNumber(weights?.fatigue, defaults.weights.fatigue),
    },
    thresholds: {
      idealDetourRatio: toNonNegativeNumber(
        thresholds?.idealDetourRatio,
        defaults.thresholds.idealDetourRatio,
      ),
      badDetourRatio: toNonNegativeNumber(
        thresholds?.badDetourRatio,
        defaults.thresholds.badDetourRatio,
      ),
      minUsefulGapMinutes: Math.round(
        toNonNegativeNumber(
          thresholds?.minUsefulGapMinutes,
          defaults.thresholds.minUsefulGapMinutes,
        ),
      ),
      minBookableGapMinutes: Math.round(
        toNonNegativeNumber(
          thresholds?.minBookableGapMinutes,
          defaults.thresholds.minBookableGapMinutes,
        ),
      ),
      lowBufferMinutes: Math.round(
        toNonNegativeNumber(
          thresholds?.lowBufferMinutes,
          defaults.thresholds.lowBufferMinutes,
        ),
      ),
      highBufferMinutes: Math.round(
        toNonNegativeNumber(
          thresholds?.highBufferMinutes,
          defaults.thresholds.highBufferMinutes,
        ),
      ),
      primeTimeLeadDays: Math.max(
        1,
        Math.round(
          toNonNegativeNumber(
            thresholds?.primeTimeLeadDays,
            defaults.thresholds.primeTimeLeadDays,
          ),
        ),
      ),
    },
  };
}

function parseJsonObject<T>(value: unknown): Partial<T> | null {
  if (!value) {
    return null;
  }

  if (isRecord(value)) {
    return value as Partial<T>;
  }

  if (typeof value !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? (parsed as Partial<T>) : null;
  } catch {
    return null;
  }
}

function mapRowToOverrides(
  row: Awaited<ReturnType<typeof getSmartPricingSettingsRow>>,
): SmartPricingSettingsOverrides | null {
  if (!row) {
    return null;
  }

  return {
    enabled: row.enabled,
    mode: row.mode,
    trainerHourlyValueCents: toFiniteNumber(
      row.trainer_hourly_value_cents,
      DEFAULT_SMART_PRICING_PARAMS.trainerHourlyValueCents,
    ),
    costPerKmCents: toFiniteNumber(
      row.cost_per_km_cents,
      DEFAULT_SMART_PRICING_PARAMS.costPerKmCents,
    ),
    passThroughRate: toFiniteNumber(
      row.pass_through_rate,
      DEFAULT_SMART_PRICING_PARAMS.passThroughRate,
    ),
    maxDiscountPct: toFiniteNumber(
      row.max_discount_pct,
      DEFAULT_SMART_PRICING_PARAMS.maxDiscountPct,
    ),
    maxSurchargePct: toFiniteNumber(
      row.max_surcharge_pct,
      DEFAULT_SMART_PRICING_PARAMS.maxSurchargePct,
    ),
    maxDiscountCents:
      row.max_discount_cents == null
        ? undefined
        : toFiniteNumber(
            row.max_discount_cents,
            DEFAULT_SMART_PRICING_PARAMS.maxDiscountCents ?? 0,
          ),
    maxSurchargeCents:
      row.max_surcharge_cents == null
        ? undefined
        : toFiniteNumber(
            row.max_surcharge_cents,
            DEFAULT_SMART_PRICING_PARAMS.maxSurchargeCents ?? 0,
          ),
    neutralZonePct: toFiniteNumber(
      row.neutral_zone_pct,
      DEFAULT_SMART_PRICING_PARAMS.neutralZonePct,
    ),
    roundToNearestCents: toFiniteNumber(
      row.round_to_nearest_cents,
      DEFAULT_SMART_PRICING_PARAMS.roundToNearestCents,
    ),
    hideIfImpactAboveCents: toFiniteNumber(
      row.hide_if_impact_above_cents,
      DEFAULT_SMART_PRICING_PARAMS.hideIfImpactAboveCents,
    ),
    availableOnRequestIfImpactAboveCents: toFiniteNumber(
      row.available_on_request_if_impact_above_cents,
      DEFAULT_SMART_PRICING_PARAMS.availableOnRequestIfImpactAboveCents,
    ),
    wasteFactor: toFiniteNumber(
      row.waste_factor,
      DEFAULT_SMART_PRICING_PARAMS.wasteFactor,
    ),
    weights: parseJsonObject<SmartPricingParams['weights']>(row.weights),
    thresholds: parseJsonObject<SmartPricingParams['thresholds']>(row.thresholds),
  };
}

export async function getSmartPricingSettings(
  instructorUserId: string,
): Promise<SmartPricingParams> {
  try {
    const row = await getSmartPricingSettingsRow(instructorUserId);
    return mergeSmartPricingParams(mapRowToOverrides(row));
  } catch (error) {
    console.error('[smart-pricing] failed to load settings', {
      instructorUserId,
      error,
    });
    return mergeSmartPricingParams();
  }
}
