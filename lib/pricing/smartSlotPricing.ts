export type SmartPricingMode =
  | 'rank_only'
  | 'discount_only'
  | 'discount_and_surcharge';

export type SmartSlotVisibility =
  | 'visible'
  | 'hidden'
  | 'available_on_request';

export type SmartSlotLabel =
  | 'best_route_price'
  | 'smart_discount'
  | 'standard_price'
  | 'flexible_slot'
  | 'available_on_request';

export type SmartPricingParams = {
  enabled: boolean;
  mode: SmartPricingMode;

  trainerHourlyValueCents: number;
  costPerKmCents: number;

  passThroughRate: number;

  maxDiscountPct: number;
  maxSurchargePct: number;

  maxDiscountCents?: number;
  maxSurchargeCents?: number;

  neutralZonePct: number;
  roundToNearestCents: number;

  hideIfImpactAboveCents: number;
  availableOnRequestIfImpactAboveCents: number;

  wasteFactor: number;

  weights: {
    marginalTravel: number;
    wastedGap: number;
    routeDisruption: number;
    opportunity: number;
    bufferRisk: number;
    endOfDayHomeDistance: number;
    clusterBenefit: number;
    recurringClientBonus: number;
    weather: number;
    fatigue: number;
  };

  thresholds: {
    idealDetourRatio: number;
    badDetourRatio: number;
    minUsefulGapMinutes: number;
    minBookableGapMinutes: number;
    lowBufferMinutes: number;
    highBufferMinutes: number;
    primeTimeLeadDays: number;
  };
};

export type ExistingSessionForPricing = {
  id?: string | number;
  start: string;
  end: string;
  lat: number | null;
  lng: number | null;
  address?: string | null;
};

export type SmartSlotPricingInput = {
  basePriceCents: number;
  serviceDurationMinutes: number;

  candidate: {
    start: string;
    end: string;
    lat: number | null;
    lng: number | null;
    address?: string | null;
  };

  previousSession?: ExistingSessionForPricing | null;
  nextSession?: ExistingSessionForPricing | null;

  daySessions: ExistingSessionForPricing[];

  trainerHome?: {
    lat: number | null;
    lng: number | null;
    address?: string | null;
  } | null;

  travel: {
    previousToCandidateMinutes?: number | null;
    candidateToNextMinutes?: number | null;
    previousToNextMinutes?: number | null;

    previousToCandidateKm?: number | null;
    candidateToNextKm?: number | null;
    previousToNextKm?: number | null;

    homeToCandidateMinutes?: number | null;
    candidateToHomeMinutes?: number | null;
    homeToNextMinutes?: number | null;
    previousLastSessionToHomeMinutes?: number | null;

    homeToCandidateKm?: number | null;
    candidateToHomeKm?: number | null;
    homeToNextKm?: number | null;
    previousLastSessionToHomeKm?: number | null;
  };

  businessContext?: {
    daysUntilSlot?: number;
    weeklyFillRate?: number;
    dailySessionCount?: number;
    dailyTargetSessions?: number;
    primeTimeScore?: number;
    localDemandDensity?: number;
    probabilityOfBetterBooking?: number;
    expectedBetterBookingMarginCents?: number;
    isRecurringClientLikely?: boolean;
    recurringClientExpectedValueCents?: number;
    boundarySlotDiscountCents?: number;
  };

  riskContext?: {
    latenessPenaltyCents?: number;
    downstreamSessionsCount?: number;
    overrunProbability?: number;
    cancellationProbability?: number;
    replacementDifficulty?: number;
  };

  weatherContext?: {
    enabled?: boolean;
    weatherSensitivity?: number;
    rainRisk?: number;
    heatRisk?: number;
    coldRisk?: number;
    windRisk?: number;
  };

  fatigueContext?: {
    cumulativeDriveMinutesBeforeSlot?: number;
    cumulativeSessionMinutesBeforeSlot?: number;
    consecutiveSessionsBeforeSlot?: number;
    difficultSessionSequenceScore?: number;
  };

  serviceContext?: {
    isRemote?: boolean;
    includesTransport?: boolean;
  };

  params: SmartPricingParams;
};

export type SmartSlotPricingResult = {
  visible: boolean;
  visibility: SmartSlotVisibility;

  basePriceCents: number;
  finalPriceCents: number;
  travelChargeCents: number;
  adjustmentCents: number;
  adjustmentPct: number;

  slotImpactCents: number;

  label: SmartSlotLabel;
  explanationKey: string;

  debug?: {
    marginalTravelCostCents: number;
    wastedGapCostCents: number;
    routeDisruptionCostCents: number;
    opportunityCostCents: number;
    bufferRiskCostCents: number;
    endOfDayHomeCostCents: number;
    clusterBenefitCents: number;
    recurringClientBonusCents: number;
    weatherCostCents: number;
    fatigueCostCents: number;
    billableTravelKm: number;
    boundarySlotDiscountCents: number;
  };
};

type SmartSlotPricingDebug = NonNullable<SmartSlotPricingResult['debug']>;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : 0;
}

function maybeNumber(value: number | null | undefined) {
  return Number.isFinite(value) ? Number(value) : null;
}

function roundCurrency(value: number) {
  return Math.round(value);
}

function roundToNearest(value: number, nearest: number) {
  if (!Number.isFinite(nearest) || nearest <= 0) {
    return Math.round(value);
  }

  return Math.round(value / nearest) * nearest;
}

function parseDateTime(value: string) {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const normalized = value.replace(' ', 'T');
  const fallback = new Date(normalized);
  return fallback;
}

function diffMinutes(start: string, end: string) {
  return Math.round(
    (parseDateTime(end).getTime() - parseDateTime(start).getTime()) / 60000,
  );
}

function computeWeatherCostCents(
  weatherContext: SmartSlotPricingInput['weatherContext'],
) {
  if (!weatherContext?.enabled) {
    return 0;
  }

  const weatherSensitivity = clamp(
    safeNumber(weatherContext.weatherSensitivity),
    0,
    1,
  );

  if (weatherSensitivity <= 0) {
    return 0;
  }

  const weatherRisk =
    0.45 * clamp(safeNumber(weatherContext.rainRisk), 0, 1) +
    0.25 * clamp(safeNumber(weatherContext.heatRisk), 0, 1) +
    0.15 * clamp(safeNumber(weatherContext.coldRisk), 0, 1) +
    0.15 * clamp(safeNumber(weatherContext.windRisk), 0, 1);

  return roundCurrency(weatherSensitivity * weatherRisk * 1200);
}

function computeFatigueCostCents(
  fatigueContext: SmartSlotPricingInput['fatigueContext'],
) {
  if (!fatigueContext) {
    return 0;
  }

  const normalizedDrive = clamp(
    safeNumber(fatigueContext.cumulativeDriveMinutesBeforeSlot) / 180,
    0,
    1,
  );
  const normalizedSessions = clamp(
    safeNumber(fatigueContext.cumulativeSessionMinutesBeforeSlot) / 360,
    0,
    1,
  );
  const consecutivePenalty = clamp(
    Math.max(safeNumber(fatigueContext.consecutiveSessionsBeforeSlot) - 2, 0) / 4,
    0,
    1,
  );
  const difficultSequenceScore = clamp(
    safeNumber(fatigueContext.difficultSessionSequenceScore),
    0,
    1,
  );

  const fatigueScore = clamp(
    normalizedDrive +
      normalizedSessions +
      consecutivePenalty +
      difficultSequenceScore,
    0,
    1,
  );

  return roundCurrency(fatigueScore * 1500);
}

function getGapBufferMinutes(params: {
  start: string;
  end: string;
  travelMinutes?: number | null;
}) {
  return diffMinutes(params.start, params.end) - safeNumber(params.travelMinutes);
}

function getWastedGapMinutes(
  gapMinutes: number | null,
  params: SmartPricingParams['thresholds'],
) {
  if (gapMinutes == null) {
    return 0;
  }

  if (
    gapMinutes > params.minUsefulGapMinutes &&
    gapMinutes < params.minBookableGapMinutes
  ) {
    return gapMinutes;
  }

  if (gapMinutes >= params.minBookableGapMinutes) {
    const softIdlePenaltyWindowMinutes = 60;
    const remainingPenaltyMinutes =
      params.minBookableGapMinutes +
      softIdlePenaltyWindowMinutes -
      gapMinutes;

    // Even when a gap is "technically bookable", a 1h30-style hole can still
    // be operationally awkward. We keep a decaying penalty for those medium-long
    // idle windows so they do not look better than tighter clustered slots.
    if (remainingPenaltyMinutes > 0) {
      return roundCurrency(remainingPenaltyMinutes * 0.6);
    }
  }

  return 0;
}

function getVisibility(
  slotImpactCents: number,
  params: SmartPricingParams,
): SmartSlotVisibility {
  if (!params.enabled) {
    return 'visible';
  }

  if (slotImpactCents >= params.hideIfImpactAboveCents) {
    return 'hidden';
  }

  if (slotImpactCents >= params.availableOnRequestIfImpactAboveCents) {
    return 'available_on_request';
  }

  return 'visible';
}

function getLabel(params: {
  adjustmentCents: number;
  adjustmentPct: number;
  slotImpactCents: number;
  visibility: SmartSlotVisibility;
  neutralZonePct: number;
  forceDiscountLabel?: boolean;
}) {
  const {
    adjustmentCents,
    adjustmentPct,
    slotImpactCents,
    visibility,
    neutralZonePct,
    forceDiscountLabel = false,
  } = params;

  if (visibility === 'available_on_request' || visibility === 'hidden') {
    return 'available_on_request' as const;
  }

  if (forceDiscountLabel && adjustmentCents < 0) {
    return 'smart_discount' as const;
  }

  if (adjustmentCents === 0 || Math.abs(adjustmentPct) <= neutralZonePct) {
    return 'standard_price' as const;
  }

  if (adjustmentCents < 0 && (slotImpactCents <= -750 || adjustmentPct <= -0.05)) {
    return 'best_route_price' as const;
  }

  if (adjustmentCents < 0) {
    return 'smart_discount' as const;
  }

  return 'flexible_slot' as const;
}

function buildExplanationKey(label: SmartSlotLabel) {
  return `smartPricing.explanations.${label}`;
}

function computeMarginalTravelCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const hasPrevious = Boolean(input.previousSession);
  const hasNext = Boolean(input.nextSession);

  let deltaDriveMinutes = 0;
  let deltaKm = 0;

  if (
    hasPrevious &&
    hasNext &&
    input.travel.previousToCandidateMinutes != null &&
    input.travel.candidateToNextMinutes != null &&
    input.travel.previousToNextMinutes != null
  ) {
    deltaDriveMinutes =
      safeNumber(input.travel.previousToCandidateMinutes) +
      safeNumber(input.travel.candidateToNextMinutes) -
      safeNumber(input.travel.previousToNextMinutes);

    deltaKm =
      safeNumber(input.travel.previousToCandidateKm) +
      safeNumber(input.travel.candidateToNextKm) -
      safeNumber(input.travel.previousToNextKm);
  } else if (!hasPrevious && !hasNext) {
    deltaDriveMinutes =
      safeNumber(input.travel.homeToCandidateMinutes) +
      safeNumber(input.travel.candidateToHomeMinutes);
    deltaKm =
      safeNumber(input.travel.homeToCandidateKm) +
      safeNumber(input.travel.candidateToHomeKm);
  } else if (!hasPrevious) {
    if (input.travel.homeToNextMinutes != null) {
      deltaDriveMinutes =
        safeNumber(input.travel.homeToCandidateMinutes) +
        safeNumber(input.travel.candidateToNextMinutes) -
        safeNumber(input.travel.homeToNextMinutes);
    } else {
      deltaDriveMinutes =
        safeNumber(input.travel.homeToCandidateMinutes) +
        safeNumber(input.travel.candidateToNextMinutes);
    }

    if (input.travel.homeToNextKm != null) {
      deltaKm =
        safeNumber(input.travel.homeToCandidateKm) +
        safeNumber(input.travel.candidateToNextKm) -
        safeNumber(input.travel.homeToNextKm);
    } else {
      deltaKm =
        safeNumber(input.travel.homeToCandidateKm) +
        safeNumber(input.travel.candidateToNextKm);
    }
  } else {
    if (input.travel.previousLastSessionToHomeMinutes != null) {
      deltaDriveMinutes =
        safeNumber(input.travel.previousToCandidateMinutes) +
        safeNumber(input.travel.candidateToHomeMinutes) -
        safeNumber(input.travel.previousLastSessionToHomeMinutes);
    } else {
      deltaDriveMinutes =
        safeNumber(input.travel.previousToCandidateMinutes) +
        safeNumber(input.travel.candidateToHomeMinutes);
    }

    if (input.travel.previousLastSessionToHomeKm != null) {
      deltaKm =
        safeNumber(input.travel.previousToCandidateKm) +
        safeNumber(input.travel.candidateToHomeKm) -
        safeNumber(input.travel.previousLastSessionToHomeKm);
    } else {
      deltaKm =
        safeNumber(input.travel.previousToCandidateKm) +
        safeNumber(input.travel.candidateToHomeKm);
    }
  }

  const timeCostCents =
    (deltaDriveMinutes / 60) * params.trainerHourlyValueCents;
  const distanceCostCents = deltaKm * params.costPerKmCents;

  return roundCurrency(timeCostCents + distanceCostCents);
}

function computeRouteDisruptionCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const previousToNextMinutes = maybeNumber(input.travel.previousToNextMinutes);
  const previousToCandidateMinutes = maybeNumber(
    input.travel.previousToCandidateMinutes,
  );
  const candidateToNextMinutes = maybeNumber(input.travel.candidateToNextMinutes);

  if (
    previousToNextMinutes == null ||
    previousToNextMinutes <= 0 ||
    previousToCandidateMinutes == null ||
    candidateToNextMinutes == null
  ) {
    return 0;
  }

  const detourRatio =
    (previousToCandidateMinutes + candidateToNextMinutes) / previousToNextMinutes;
  const normalized = clamp(
    (Math.max(0, detourRatio - params.thresholds.idealDetourRatio) /
      Math.max(
        params.thresholds.badDetourRatio - params.thresholds.idealDetourRatio,
        0.0001,
      )) || 0,
    0,
    1,
  );

  return roundCurrency(normalized * 3000);
}

function computeOpportunityCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const primeTimeScore = clamp(
    safeNumber(input.businessContext?.primeTimeScore),
    0,
    1,
  );
  const daysUntilSlot = clamp(
    safeNumber(input.businessContext?.daysUntilSlot),
    0,
    params.thresholds.primeTimeLeadDays,
  );
  const leadTimeFactor = clamp(
    daysUntilSlot / Math.max(params.thresholds.primeTimeLeadDays, 1),
    0,
    1,
  );
  const probabilityOfBetterBooking = clamp(
    safeNumber(input.businessContext?.probabilityOfBetterBooking),
    0,
    1,
  );
  const expectedBetterBookingMarginCents = Math.max(
    0,
    safeNumber(input.businessContext?.expectedBetterBookingMarginCents),
  );

  let opportunityCost =
    primeTimeScore *
    leadTimeFactor *
    probabilityOfBetterBooking *
    expectedBetterBookingMarginCents;

  const weeklyFillRate = maybeNumber(input.businessContext?.weeklyFillRate);
  if (weeklyFillRate != null) {
    if (weeklyFillRate < 0.4) {
      opportunityCost *= 0.5;
    } else if (weeklyFillRate > 0.8) {
      opportunityCost *= 1.3;
    }
  }

  return roundCurrency(opportunityCost);
}

function computeBufferRiskCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const thresholdRange = Math.max(
    params.thresholds.highBufferMinutes - params.thresholds.lowBufferMinutes,
    1,
  );

  const bufferBefore = input.previousSession
    ? getGapBufferMinutes({
        start: input.previousSession.end,
        end: input.candidate.start,
        travelMinutes: input.travel.previousToCandidateMinutes,
      })
    : null;
  const bufferAfter = input.nextSession
    ? getGapBufferMinutes({
        start: input.candidate.end,
        end: input.nextSession.start,
        travelMinutes: input.travel.candidateToNextMinutes,
      })
    : null;

  const normalizeBufferRisk = (bufferMinutes: number | null) => {
    if (bufferMinutes == null) {
      return 0;
    }

    if (bufferMinutes <= params.thresholds.lowBufferMinutes) {
      return 1;
    }

    if (bufferMinutes >= params.thresholds.highBufferMinutes) {
      return 0;
    }

    return clamp(
      1 - (bufferMinutes - params.thresholds.lowBufferMinutes) / thresholdRange,
      0,
      1,
    );
  };

  const bufferRisk = Math.max(
    normalizeBufferRisk(bufferBefore),
    normalizeBufferRisk(bufferAfter),
  );
  const overrunProbability = clamp(
    safeNumber(input.riskContext?.overrunProbability),
    0,
    1,
  );
  const latenessProbability = clamp(
    Math.max(bufferRisk, overrunProbability),
    0,
    1,
  );
  const downstreamSessionsCount = Math.max(
    1,
    safeNumber(
      input.riskContext?.downstreamSessionsCount ??
        (input.nextSession ? 1 : 0),
    ),
  );
  const latenessPenaltyCents = Math.max(
    0,
    safeNumber(input.riskContext?.latenessPenaltyCents ?? 2000),
  );

  return roundCurrency(
    latenessProbability * downstreamSessionsCount * latenessPenaltyCents,
  );
}

function computeEndOfDayHomeCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  if (input.nextSession) {
    return 0;
  }

  const homeReturnDeltaMinutes =
    safeNumber(input.travel.candidateToHomeMinutes) -
    safeNumber(input.travel.previousLastSessionToHomeMinutes);

  if (homeReturnDeltaMinutes <= 0) {
    return 0;
  }

  return roundCurrency(
    (homeReturnDeltaMinutes / 60) * params.trainerHourlyValueCents,
  );
}

function getNeighborClusterBenefitCents(params: {
  travelMinutes: number | null;
  gapBufferMinutes: number | null;
}) {
  const { travelMinutes, gapBufferMinutes } = params;

  if (travelMinutes == null) {
    return 0;
  }

  let baseBenefit = 0;
  if (travelMinutes <= 10) {
    baseBenefit = 1500;
  } else if (travelMinutes <= 20) {
    baseBenefit = 800;
  } else if (travelMinutes <= 35) {
    baseBenefit = 300;
  }

  if (baseBenefit === 0) {
    return 0;
  }

  if (gapBufferMinutes == null) {
    return baseBenefit;
  }

  if (gapBufferMinutes <= 15) {
    return baseBenefit;
  }

  if (gapBufferMinutes <= 30) {
    return roundCurrency(baseBenefit * 0.75);
  }

  if (gapBufferMinutes <= 45) {
    return roundCurrency(baseBenefit * 0.45);
  }

  if (gapBufferMinutes <= 60) {
    return roundCurrency(baseBenefit * 0.2);
  }

  return 0;
}

function computeClusterBenefitCents(input: SmartSlotPricingInput) {
  if (!input.previousSession && !input.nextSession) {
    return 0;
  }

  const previousGapBufferMinutes = input.previousSession
    ? getGapBufferMinutes({
        start: input.previousSession.end,
        end: input.candidate.start,
        travelMinutes: input.travel.previousToCandidateMinutes,
      })
    : null;
  const nextGapBufferMinutes = input.nextSession
    ? getGapBufferMinutes({
        start: input.candidate.end,
        end: input.nextSession.start,
        travelMinutes: input.travel.candidateToNextMinutes,
      })
    : null;

  const previousBenefit = input.previousSession
    ? getNeighborClusterBenefitCents({
        travelMinutes: maybeNumber(input.travel.previousToCandidateMinutes),
        gapBufferMinutes: previousGapBufferMinutes,
      })
    : 0;
  const nextBenefit = input.nextSession
    ? getNeighborClusterBenefitCents({
        travelMinutes: maybeNumber(input.travel.candidateToNextMinutes),
        gapBufferMinutes: nextGapBufferMinutes,
      })
    : 0;

  const activeBenefits = [previousBenefit, nextBenefit].filter(
    (benefit) => benefit > 0,
  );

  if (activeBenefits.length === 0) {
    return 0;
  }

  if (activeBenefits.length === 1) {
    // A single nearby booking should mostly neutralize friction, not create an
    // aggressive discount by itself.
    return roundCurrency(activeBenefits[0] * 0.5);
  }

  return Math.min(previousBenefit + nextBenefit, 3000);
}

function computeRecurringClientBonusCents(
  businessContext: SmartSlotPricingInput['businessContext'],
) {
  if (!businessContext?.isRecurringClientLikely) {
    return 0;
  }

  const recurringValue = Math.max(
    0,
    safeNumber(businessContext.recurringClientExpectedValueCents),
  );

  return roundCurrency(Math.min(recurringValue * 0.1, 2500));
}

function computeWastedGapCostCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const wastedBeforeMinutes = input.previousSession
    ? getWastedGapMinutes(
        getGapBufferMinutes({
          start: input.previousSession.end,
          end: input.candidate.start,
          travelMinutes: input.travel.previousToCandidateMinutes,
        }),
        params.thresholds,
      )
    : 0;
  const wastedAfterMinutes = input.nextSession
    ? getWastedGapMinutes(
        getGapBufferMinutes({
          start: input.candidate.end,
          end: input.nextSession.start,
          travelMinutes: input.travel.candidateToNextMinutes,
        }),
        params.thresholds,
      )
    : 0;
  const wastedGapMinutes = wastedBeforeMinutes + wastedAfterMinutes;

  return roundCurrency(
    (wastedGapMinutes / 60) *
      params.trainerHourlyValueCents *
      params.wasteFactor,
  );
}

function shouldChargeTravel(input: SmartSlotPricingInput) {
  return Boolean(
    input.serviceContext &&
      !input.serviceContext.isRemote &&
      !input.serviceContext.includesTransport,
  );
}

function computeBillableTravelKm(input: SmartSlotPricingInput) {
  if (!shouldChargeTravel(input)) {
    return 0;
  }

  return (
    Math.max(0, safeNumber(input.travel.homeToCandidateKm)) +
    Math.max(0, safeNumber(input.travel.candidateToHomeKm))
  );
}

function computeTravelChargeCents(
  input: SmartSlotPricingInput,
  params: SmartPricingParams,
) {
  const billableTravelKm = computeBillableTravelKm(input);

  return {
    billableTravelKm,
    travelChargeCents: roundCurrency(
      billableTravelKm * Math.max(0, params.costPerKmCents),
    ),
  };
}

function computeBoundarySlotDiscountCents(input: SmartSlotPricingInput) {
  return roundCurrency(
    clamp(safeNumber(input.businessContext?.boundarySlotDiscountCents), 0, 100),
  );
}

function zeroResult(
  basePriceCents: number,
  travelChargeCents = 0,
  billableTravelKm = 0,
): SmartSlotPricingResult {
  return {
    visible: true,
    visibility: 'visible',
    basePriceCents,
    finalPriceCents: basePriceCents + travelChargeCents,
    travelChargeCents,
    adjustmentCents: 0,
    adjustmentPct: 0,
    slotImpactCents: 0,
    label: 'standard_price',
    explanationKey: buildExplanationKey('standard_price'),
    debug: {
      marginalTravelCostCents: 0,
      wastedGapCostCents: 0,
      routeDisruptionCostCents: 0,
      opportunityCostCents: 0,
      bufferRiskCostCents: 0,
      endOfDayHomeCostCents: 0,
      clusterBenefitCents: 0,
      recurringClientBonusCents: 0,
      weatherCostCents: 0,
      fatigueCostCents: 0,
      billableTravelKm,
      boundarySlotDiscountCents: 0,
    },
  };
}

export function computeSmartSlotPricing(
  input: SmartSlotPricingInput,
): SmartSlotPricingResult {
  const basePriceCents = Math.max(0, roundCurrency(input.basePriceCents));
  const params = input.params;
  const { billableTravelKm, travelChargeCents } = computeTravelChargeCents(
    input,
    params,
  );

  if (!params.enabled) {
    return zeroResult(basePriceCents, travelChargeCents, billableTravelKm);
  }

  const debug: SmartSlotPricingDebug = {
    marginalTravelCostCents: computeMarginalTravelCostCents(input, params),
    wastedGapCostCents: computeWastedGapCostCents(input, params),
    routeDisruptionCostCents: computeRouteDisruptionCostCents(input, params),
    opportunityCostCents: computeOpportunityCostCents(input, params),
    bufferRiskCostCents: computeBufferRiskCostCents(input, params),
    endOfDayHomeCostCents: computeEndOfDayHomeCostCents(input, params),
    clusterBenefitCents: computeClusterBenefitCents(input),
    recurringClientBonusCents: computeRecurringClientBonusCents(
      input.businessContext,
    ),
    weatherCostCents: computeWeatherCostCents(input.weatherContext),
    fatigueCostCents: computeFatigueCostCents(input.fatigueContext),
    billableTravelKm,
    boundarySlotDiscountCents: computeBoundarySlotDiscountCents(input),
  };

  // Weighted cost model: expensive operational friction raises impact,
  // while route clustering and recurring value reduce it.
  const slotImpactCents = roundCurrency(
    params.weights.marginalTravel * debug.marginalTravelCostCents +
      params.weights.wastedGap * debug.wastedGapCostCents +
      params.weights.routeDisruption * debug.routeDisruptionCostCents +
      params.weights.opportunity * debug.opportunityCostCents +
      params.weights.bufferRisk * debug.bufferRiskCostCents +
      params.weights.endOfDayHomeDistance * debug.endOfDayHomeCostCents +
      params.weights.weather * debug.weatherCostCents +
      params.weights.fatigue * debug.fatigueCostCents -
      params.weights.clusterBenefit * debug.clusterBenefitCents -
      params.weights.recurringClientBonus * debug.recurringClientBonusCents,
  );

  const visibility = getVisibility(slotImpactCents, params);
  const rawAdjustmentCents = params.passThroughRate * slotImpactCents;

  let adjustmentCents =
    params.mode === 'rank_only'
      ? 0
      : params.mode === 'discount_only'
        ? Math.min(rawAdjustmentCents, 0)
        : rawAdjustmentCents;

  const maxDiscountByPct = basePriceCents * params.maxDiscountPct;
  const maxSurchargeByPct = basePriceCents * params.maxSurchargePct;
  const maxDiscountCents =
    params.maxDiscountCents != null
      ? Math.min(maxDiscountByPct, params.maxDiscountCents)
      : maxDiscountByPct;
  const maxSurchargeCents =
    params.maxSurchargeCents != null
      ? Math.min(maxSurchargeByPct, params.maxSurchargeCents)
      : maxSurchargeByPct;

  adjustmentCents = clamp(adjustmentCents, -maxDiscountCents, maxSurchargeCents);

  const adjustmentPctRaw =
    basePriceCents > 0 ? adjustmentCents / basePriceCents : 0;
  if (Math.abs(adjustmentPctRaw) <= params.neutralZonePct) {
    adjustmentCents = 0;
  }

  // Keep standard-price slots exact: rounding is only meant to tidy adjusted
  // discounts/surcharges, not to mutate the catalog price when adjustment is zero.
  let finalPriceCents =
    adjustmentCents === 0
      ? basePriceCents + travelChargeCents
      : roundToNearest(
          Math.max(0, basePriceCents + travelChargeCents + adjustmentCents),
          params.roundToNearestCents,
        );

  // Tiny edge-slot nudge: after normal rounding, take exactly 1 euro off the
  // single slot that hugs a useful window boundary, so the incentive remains visible.
  if (params.mode !== 'rank_only' && debug.boundarySlotDiscountCents > 0) {
    finalPriceCents = Math.max(0, finalPriceCents - debug.boundarySlotDiscountCents);
  }

  if (finalPriceCents < 0) {
    finalPriceCents = 0;
  }

  adjustmentCents = finalPriceCents - basePriceCents - travelChargeCents;
  const adjustmentPct =
    basePriceCents > 0 ? adjustmentCents / basePriceCents : 0;

  const label = getLabel({
    adjustmentCents,
    adjustmentPct,
    slotImpactCents,
    visibility,
    neutralZonePct: params.neutralZonePct,
    forceDiscountLabel: debug.boundarySlotDiscountCents > 0,
  });

  return {
    visible: visibility === 'visible',
    visibility,
    basePriceCents,
    finalPriceCents,
    travelChargeCents,
    adjustmentCents,
    adjustmentPct,
    slotImpactCents,
    label,
    explanationKey: buildExplanationKey(label),
    debug,
  };
}
