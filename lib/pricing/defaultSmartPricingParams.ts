import type { SmartPricingParams } from './smartSlotPricing';

export const DEFAULT_SMART_PRICING_PARAMS: SmartPricingParams = {
  enabled: true,
  mode: 'discount_only',

  trainerHourlyValueCents: 4500,
  costPerKmCents: 45,

  passThroughRate: 0.5,

  maxDiscountPct: 0.2,
  maxSurchargePct: 0.15,

  maxDiscountCents: 1800,
  maxSurchargeCents: 2500,

  neutralZonePct: 0.03,
  roundToNearestCents: 500,

  hideIfImpactAboveCents: 7000,
  availableOnRequestIfImpactAboveCents: 5000,

  wasteFactor: 0.6,

  weights: {
    marginalTravel: 0.75,
    wastedGap: 0.6,
    routeDisruption: 0.5,
    opportunity: 0.7,
    bufferRisk: 0.5,
    endOfDayHomeDistance: 0.4,
    clusterBenefit: 0.6,
    recurringClientBonus: 0.4,
    weather: 0.25,
    fatigue: 0.25,
  },

  thresholds: {
    idealDetourRatio: 1.2,
    badDetourRatio: 1.8,
    minUsefulGapMinutes: 15,
    minBookableGapMinutes: 85,
    lowBufferMinutes: 10,
    highBufferMinutes: 25,
    primeTimeLeadDays: 21,
  },
};
