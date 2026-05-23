import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_SMART_PRICING_PARAMS } from './defaultSmartPricingParams.ts';
import {
  computeSmartSlotPricing,
  type ExistingSessionForPricing,
  type SmartSlotPricingInput,
} from './smartSlotPricing.ts';

function buildSession(start: string, end: string): ExistingSessionForPricing {
  return {
    start,
    end,
    lat: 48.8566,
    lng: 2.3522,
    address: 'Paris',
  };
}

function buildInput(
  overrides: Partial<SmartSlotPricingInput> = {},
): SmartSlotPricingInput {
  const previousSession = buildSession('2026-05-20T09:00:00', '2026-05-20T10:00:00');
  const nextSession = buildSession('2026-05-20T12:00:00', '2026-05-20T13:00:00');

  return {
    basePriceCents: 9000,
    serviceDurationMinutes: 60,
    candidate: {
      start: '2026-05-20T10:30:00',
      end: '2026-05-20T11:30:00',
      lat: 48.8566,
      lng: 2.3522,
      address: 'Paris 11',
    },
    previousSession,
    nextSession,
    daySessions: [previousSession, nextSession],
    trainerHome: {
      lat: 48.8647,
      lng: 2.349,
      address: 'Home',
    },
    travel: {
      previousToCandidateMinutes: 15,
      candidateToNextMinutes: 15,
      previousToNextMinutes: 35,
      previousToCandidateKm: 6,
      candidateToNextKm: 5,
      previousToNextKm: 13,
      homeToCandidateMinutes: 20,
      candidateToHomeMinutes: 20,
      previousLastSessionToHomeMinutes: 15,
      homeToCandidateKm: 8,
      candidateToHomeKm: 8,
    },
    businessContext: {
      daysUntilSlot: 10,
      weeklyFillRate: 0.65,
      primeTimeScore: 0.3,
      probabilityOfBetterBooking: 0.2,
      expectedBetterBookingMarginCents: 1000,
      isRecurringClientLikely: false,
      recurringClientExpectedValueCents: 0,
    },
    riskContext: {
      latenessPenaltyCents: 1800,
      downstreamSessionsCount: 1,
      overrunProbability: 0.15,
    },
    weatherContext: {
      enabled: false,
    },
    fatigueContext: {
      cumulativeDriveMinutesBeforeSlot: 30,
      cumulativeSessionMinutesBeforeSlot: 60,
      consecutiveSessionsBeforeSlot: 1,
      difficultSessionSequenceScore: 0,
    },
    params: {
      ...DEFAULT_SMART_PRICING_PARAMS,
    },
    ...overrides,
  };
}

test('excellent route slot gets a strong discount and best-route label', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      travel: {
        previousToCandidateMinutes: 10,
        candidateToNextMinutes: 10,
        previousToNextMinutes: 35,
        previousToCandidateKm: 3,
        candidateToNextKm: 3,
        previousToNextKm: 10,
        homeToCandidateMinutes: 15,
        candidateToHomeMinutes: 15,
        previousLastSessionToHomeMinutes: 20,
        homeToCandidateKm: 5,
        candidateToHomeKm: 5,
      },
      businessContext: {
        daysUntilSlot: 4,
        weeklyFillRate: 0.45,
        primeTimeScore: 0.1,
        probabilityOfBetterBooking: 0,
        expectedBetterBookingMarginCents: 0,
        isRecurringClientLikely: true,
        recurringClientExpectedValueCents: 12000,
      },
    }),
  );

  assert.equal(result.visibility, 'visible');
  assert.ok(result.adjustmentCents < 0);
  assert.equal(result.label, 'best_route_price');
  assert.ok(result.finalPriceCents < result.basePriceCents);
});

test('a one-sided same-address slot close to another session stays at standard price', () => {
  const nextSession = buildSession('2026-05-20T12:00:00', '2026-05-20T13:00:00');

  const result = computeSmartSlotPricing(
    buildInput({
      candidate: {
        start: '2026-05-20T10:30:00',
        end: '2026-05-20T11:30:00',
        lat: 48.8566,
        lng: 2.3522,
        address: 'Same address',
      },
      previousSession: null,
      nextSession,
      daySessions: [nextSession],
      travel: {
        previousToCandidateMinutes: null,
        candidateToNextMinutes: 0,
        previousToNextMinutes: null,
        previousToCandidateKm: null,
        candidateToNextKm: 0,
        previousToNextKm: null,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        homeToNextMinutes: 20,
        previousLastSessionToHomeMinutes: null,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
        homeToNextKm: 8,
        previousLastSessionToHomeKm: null,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_only',
      },
    }),
  );

  assert.equal(result.label, 'standard_price');
  assert.equal(result.finalPriceCents, result.basePriceCents);
});

test('a large idle gap at the same address should not get a better price than a tight gap', () => {
  const nextSession = buildSession('2026-05-20T12:00:00', '2026-05-20T13:00:00');

  const tightGapResult = computeSmartSlotPricing(
    buildInput({
      candidate: {
        start: '2026-05-20T10:30:00',
        end: '2026-05-20T11:30:00',
        lat: 48.8566,
        lng: 2.3522,
        address: 'Same address',
      },
      previousSession: null,
      nextSession,
      daySessions: [nextSession],
      travel: {
        previousToCandidateMinutes: null,
        candidateToNextMinutes: 0,
        previousToNextMinutes: null,
        previousToCandidateKm: null,
        candidateToNextKm: 0,
        previousToNextKm: null,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        homeToNextMinutes: 20,
        previousLastSessionToHomeMinutes: null,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
        homeToNextKm: 8,
        previousLastSessionToHomeKm: null,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_only',
      },
    }),
  );

  const largeGapResult = computeSmartSlotPricing(
    buildInput({
      candidate: {
        start: '2026-05-20T09:30:00',
        end: '2026-05-20T10:30:00',
        lat: 48.8566,
        lng: 2.3522,
        address: 'Same address',
      },
      previousSession: null,
      nextSession,
      daySessions: [nextSession],
      travel: {
        previousToCandidateMinutes: null,
        candidateToNextMinutes: 0,
        previousToNextMinutes: null,
        previousToCandidateKm: null,
        candidateToNextKm: 0,
        previousToNextKm: null,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        homeToNextMinutes: 20,
        previousLastSessionToHomeMinutes: null,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
        homeToNextKm: 8,
        previousLastSessionToHomeKm: null,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_only',
      },
    }),
  );

  assert.ok(largeGapResult.slotImpactCents >= tightGapResult.slotImpactCents);
  assert.equal(largeGapResult.finalPriceCents, largeGapResult.basePriceCents);
});

test('neutral slot lands on the standard price through the neutral zone', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      basePriceCents: 9300,
      travel: {
        previousToCandidateMinutes: 18,
        candidateToNextMinutes: 17,
        previousToNextMinutes: 35,
        previousToCandidateKm: 6.5,
        candidateToNextKm: 6.5,
        previousToNextKm: 13,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        previousLastSessionToHomeMinutes: 20,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
      },
      businessContext: {
        daysUntilSlot: 2,
        weeklyFillRate: 0.5,
        primeTimeScore: 0,
        probabilityOfBetterBooking: 0,
        expectedBetterBookingMarginCents: 0,
      },
      riskContext: {
        latenessPenaltyCents: 1000,
        downstreamSessionsCount: 1,
        overrunProbability: 0,
      },
      fatigueContext: {
        cumulativeDriveMinutesBeforeSlot: 0,
        cumulativeSessionMinutesBeforeSlot: 0,
        consecutiveSessionsBeforeSlot: 0,
        difficultSessionSequenceScore: 0,
      },
    }),
  );

  assert.equal(result.label, 'standard_price');
  assert.equal(result.adjustmentCents, 0);
  assert.equal(result.finalPriceCents, result.basePriceCents);
  assert.equal(result.finalPriceCents, 9300);
});

test('bad slot surcharges in discount_and_surcharge mode', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      candidate: {
        start: '2026-05-20T10:20:00',
        end: '2026-05-20T11:20:00',
        lat: 48.89,
        lng: 2.42,
        address: 'Far slot',
      },
      travel: {
        previousToCandidateMinutes: 22,
        candidateToNextMinutes: 24,
        previousToNextMinutes: 30,
        previousToCandidateKm: 8,
        candidateToNextKm: 8,
        previousToNextKm: 7,
        homeToCandidateMinutes: 22,
        candidateToHomeMinutes: 24,
        previousLastSessionToHomeMinutes: 15,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
      },
      businessContext: {
        daysUntilSlot: 18,
        weeklyFillRate: 0.8,
        primeTimeScore: 0.5,
        probabilityOfBetterBooking: 0.5,
        expectedBetterBookingMarginCents: 1200,
      },
      riskContext: {
        latenessPenaltyCents: 1500,
        downstreamSessionsCount: 1,
        overrunProbability: 0.2,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_and_surcharge',
      },
    }),
  );

  assert.equal(result.visibility, 'visible');
  assert.ok(result.adjustmentCents > 0);
  assert.ok(result.finalPriceCents > result.basePriceCents);
  assert.equal(result.label, 'flexible_slot');
});

test('bad slot does not surcharge in discount_only mode', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      travel: {
        previousToCandidateMinutes: 35,
        candidateToNextMinutes: 40,
        previousToNextMinutes: 20,
        previousToCandidateKm: 20,
        candidateToNextKm: 18,
        previousToNextKm: 8,
        homeToCandidateMinutes: 35,
        candidateToHomeMinutes: 40,
        previousLastSessionToHomeMinutes: 15,
        homeToCandidateKm: 20,
        candidateToHomeKm: 20,
      },
      businessContext: {
        daysUntilSlot: 21,
        weeklyFillRate: 0.92,
        primeTimeScore: 1,
        probabilityOfBetterBooking: 0.9,
        expectedBetterBookingMarginCents: 2800,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_only',
      },
    }),
  );

  assert.equal(result.finalPriceCents, result.basePriceCents);
  assert.equal(result.adjustmentCents, 0);
});

test('very bad slot becomes available on request', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      travel: {
        previousToCandidateMinutes: 25,
        candidateToNextMinutes: 30,
        previousToNextMinutes: 20,
        previousToCandidateKm: 10,
        candidateToNextKm: 10,
        previousToNextKm: 6,
        homeToCandidateMinutes: 25,
        candidateToHomeMinutes: 30,
        previousLastSessionToHomeMinutes: 15,
        homeToCandidateKm: 10,
        candidateToHomeKm: 10,
      },
      businessContext: {
        daysUntilSlot: 21,
        weeklyFillRate: 0.85,
        primeTimeScore: 0.7,
        probabilityOfBetterBooking: 0.6,
        expectedBetterBookingMarginCents: 1800,
      },
      riskContext: {
        latenessPenaltyCents: 1800,
        downstreamSessionsCount: 1,
        overrunProbability: 0.3,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_and_surcharge',
        availableOnRequestIfImpactAboveCents: 5000,
        hideIfImpactAboveCents: 9000,
      },
    }),
  );

  assert.equal(result.visibility, 'available_on_request');
  assert.equal(result.visible, false);
});

test('extremely bad slot is hidden', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      travel: {
        previousToCandidateMinutes: 70,
        candidateToNextMinutes: 75,
        previousToNextMinutes: 10,
        previousToCandidateKm: 30,
        candidateToNextKm: 30,
        previousToNextKm: 2,
        homeToCandidateMinutes: 60,
        candidateToHomeMinutes: 65,
        previousLastSessionToHomeMinutes: 10,
        homeToCandidateKm: 25,
        candidateToHomeKm: 25,
      },
      businessContext: {
        daysUntilSlot: 21,
        weeklyFillRate: 0.95,
        primeTimeScore: 1,
        probabilityOfBetterBooking: 1,
        expectedBetterBookingMarginCents: 3500,
      },
      riskContext: {
        latenessPenaltyCents: 3000,
        downstreamSessionsCount: 3,
        overrunProbability: 0.8,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_and_surcharge',
      },
    }),
  );

  assert.equal(result.visibility, 'hidden');
  assert.equal(result.visible, false);
});

test('final price rounds to the nearest five euros', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      basePriceCents: 9300,
      travel: {
        previousToCandidateMinutes: 25,
        candidateToNextMinutes: 30,
        previousToNextMinutes: 15,
        previousToCandidateKm: 12,
        candidateToNextKm: 10,
        previousToNextKm: 4,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        previousLastSessionToHomeMinutes: 15,
        homeToCandidateKm: 8,
        candidateToHomeKm: 8,
      },
      businessContext: {
        daysUntilSlot: 15,
        weeklyFillRate: 0.8,
        primeTimeScore: 0.6,
        probabilityOfBetterBooking: 0.4,
        expectedBetterBookingMarginCents: 1500,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_and_surcharge',
        passThroughRate: 0.35,
      },
    }),
  );

  assert.equal(result.finalPriceCents % 500, 0);
});

test('non-remote service without included transport adds round-trip travel cost', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      basePriceCents: 9000,
      serviceContext: {
        isRemote: false,
        includesTransport: false,
      },
      travel: {
        previousToCandidateMinutes: 0,
        candidateToNextMinutes: 0,
        previousToNextMinutes: 0,
        previousToCandidateKm: 0,
        candidateToNextKm: 0,
        previousToNextKm: 0,
        homeToCandidateMinutes: 20,
        candidateToHomeMinutes: 20,
        previousLastSessionToHomeMinutes: 0,
        homeToCandidateKm: 10,
        candidateToHomeKm: 10,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'rank_only',
        costPerKmCents: 100,
      },
    }),
  );

  assert.equal(result.travelChargeCents, 2000);
  assert.equal(result.adjustmentCents, 0);
  assert.equal(result.finalPriceCents, 11000);
});

test('remote or transport-included services do not add travel cost', () => {
  const remoteResult = computeSmartSlotPricing(
    buildInput({
      serviceContext: {
        isRemote: true,
        includesTransport: false,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'rank_only',
        costPerKmCents: 100,
      },
    }),
  );
  const includedResult = computeSmartSlotPricing(
    buildInput({
      serviceContext: {
        isRemote: false,
        includesTransport: true,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'rank_only',
        costPerKmCents: 100,
      },
    }),
  );

  assert.equal(remoteResult.travelChargeCents, 0);
  assert.equal(includedResult.travelChargeCents, 0);
  assert.equal(remoteResult.finalPriceCents, remoteResult.basePriceCents);
  assert.equal(includedResult.finalPriceCents, includedResult.basePriceCents);
});

test('boundary slot gets a visible one euro discount without five-euro rounding', () => {
  const result = computeSmartSlotPricing(
    buildInput({
      basePriceCents: 9300,
      previousSession: null,
      nextSession: null,
      daySessions: [],
      travel: {
        previousToCandidateMinutes: 0,
        candidateToNextMinutes: 0,
        previousToNextMinutes: null,
        previousToCandidateKm: 0,
        candidateToNextKm: 0,
        previousToNextKm: null,
        homeToCandidateMinutes: 0,
        candidateToHomeMinutes: 0,
        previousLastSessionToHomeMinutes: null,
        homeToCandidateKm: 0,
        candidateToHomeKm: 0,
      },
      businessContext: {
        daysUntilSlot: 0,
        weeklyFillRate: 0,
        primeTimeScore: 0,
        probabilityOfBetterBooking: 0,
        expectedBetterBookingMarginCents: 0,
        boundarySlotDiscountCents: 100,
      },
      riskContext: {
        latenessPenaltyCents: 0,
        downstreamSessionsCount: 0,
        overrunProbability: 0,
      },
      fatigueContext: {
        cumulativeDriveMinutesBeforeSlot: 0,
        cumulativeSessionMinutesBeforeSlot: 0,
        consecutiveSessionsBeforeSlot: 0,
        difficultSessionSequenceScore: 0,
      },
      params: {
        ...DEFAULT_SMART_PRICING_PARAMS,
        mode: 'discount_only',
        roundToNearestCents: 500,
      },
    }),
  );

  assert.equal(result.adjustmentCents, -100);
  assert.equal(result.finalPriceCents, 9200);
  assert.equal(result.label, 'smart_discount');
});
