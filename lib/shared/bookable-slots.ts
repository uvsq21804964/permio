import { minutesToTime, timeToMinutes } from '@/lib/client/utils/booking';
import type {
  SmartSlotLabel,
  SmartSlotVisibility,
} from '@/lib/pricing/smartSlotPricing';

export type SmartPricingClientPayload = {
  enabled: boolean;
  visibility: SmartSlotVisibility;
  basePriceCents: number;
  finalPriceCents: number;
  travelChargeCents: number;
  adjustmentCents: number;
  adjustmentPct: number;
  label: SmartSlotLabel;
  explanationKey: string;
};

export function hasDiscountedSmartPrice(
  smartPricing?: SmartPricingClientPayload | null,
) {
  return Boolean(smartPricing && smartPricing.adjustmentCents < 0);
}

export function hasSurchargedSmartPrice(
  smartPricing?: SmartPricingClientPayload | null,
) {
  return Boolean(smartPricing && smartPricing.adjustmentCents > 0);
}

export type ClientBookingSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

export type ExactBookableSlot = {
  id: string;
  date: string;
  windowStartTime: string;
  windowEndTime: string;
  serviceStartTime: string;
  serviceEndTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
  smartPricing?: SmartPricingClientPayload;
};

export const EXACT_BOOKING_STEP_MINUTES = 5;

function stripSeconds(time: string) {
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  return time;
}

function normalizeClientSlot(slot: ClientBookingSlot): ClientBookingSlot {
  return {
    ...slot,
    startTime: stripSeconds(slot.startTime),
    endTime: stripSeconds(slot.endTime),
    travelBeforeMinutes: slot.travelBeforeMinutes ?? 0,
    travelAfterMinutes: slot.travelAfterMinutes ?? 0,
    fromLabel: slot.fromLabel ?? '',
    toLabel: slot.toLabel ?? '',
  };
}

function isSlotStillValid(slot: ClientBookingSlot) {
  return timeToMinutes(slot.endTime) > timeToMinutes(slot.startTime);
}

function isSlotLongEnough(
  slot: ClientBookingSlot,
  serviceDuration: number | null | undefined,
) {
  if (serviceDuration == null) {
    return true;
  }

  return (
    timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime) >= serviceDuration
  );
}

function isSlotAfterEarliestAllowed(
  dateIso: string,
  slot: ClientBookingSlot,
  earliestAllowed: Date,
) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hour, minute] = slot.startTime.split(':').map(Number);
  const slotDateTime = new Date(
    year || earliestAllowed.getFullYear(),
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    0,
    0,
  );

  return slotDateTime >= earliestAllowed;
}

function isExactSlotAfterEarliestAllowed(
  dateIso: string,
  serviceStartTime: string,
  earliestAllowed: Date,
) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hour, minute] = serviceStartTime.split(':').map(Number);
  const slotDateTime = new Date(
    year || earliestAllowed.getFullYear(),
    (month || 1) - 1,
    day || 1,
    hour || 0,
    minute || 0,
    0,
    0,
  );

  return slotDateTime >= earliestAllowed;
}

function normalizeExactSlot(slot: ExactBookableSlot): ExactBookableSlot {
  return {
    ...slot,
    windowStartTime: stripSeconds(slot.windowStartTime),
    windowEndTime: stripSeconds(slot.windowEndTime),
    serviceStartTime: stripSeconds(slot.serviceStartTime),
    serviceEndTime: stripSeconds(slot.serviceEndTime),
    travelBeforeMinutes: slot.travelBeforeMinutes ?? 0,
    travelAfterMinutes: slot.travelAfterMinutes ?? 0,
    fromLabel: slot.fromLabel ?? '',
    toLabel: slot.toLabel ?? '',
  };
}

export function getVisibleClientSlots(options: {
  dateIso: string;
  rawSlots: ClientBookingSlot[];
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
}) {
  const { dateIso, earliestAllowed, rawSlots, serviceDuration } = options;

  return rawSlots
    .map(normalizeClientSlot)
    .filter(isSlotStillValid)
    .filter((slot) => isSlotLongEnough(slot, serviceDuration))
    .filter((slot) => isSlotAfterEarliestAllowed(dateIso, slot, earliestAllowed));
}

export function getExactBookableSlotsForWindow(options: {
  dateIso: string;
  rawSlot: ClientBookingSlot;
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
  stepMinutes?: number;
}) {
  const {
    dateIso,
    earliestAllowed,
    rawSlot,
    serviceDuration,
    stepMinutes = EXACT_BOOKING_STEP_MINUTES,
  } = options;

  const slot = normalizeClientSlot(rawSlot);

  if (!isSlotStillValid(slot)) {
    return [] as ExactBookableSlot[];
  }

  if (serviceDuration == null || serviceDuration <= 0) {
    if (!isSlotAfterEarliestAllowed(dateIso, slot, earliestAllowed)) {
      return [] as ExactBookableSlot[];
    }

    return [
      {
        id: `${dateIso}-${slot.startTime}-${slot.endTime}`,
        date: dateIso,
        windowStartTime: slot.startTime,
        windowEndTime: slot.endTime,
        serviceStartTime: slot.startTime,
        serviceEndTime: slot.endTime,
        travelBeforeMinutes: slot.travelBeforeMinutes ?? 0,
        travelAfterMinutes: slot.travelAfterMinutes ?? 0,
        fromLabel: slot.fromLabel ?? '',
        toLabel: slot.toLabel ?? '',
      },
    ];
  }

  const windowStartMinutes = timeToMinutes(slot.startTime);
  const windowEndMinutes = timeToMinutes(slot.endTime);
  const latestStartMinutes = windowEndMinutes - serviceDuration;

  if (latestStartMinutes < windowStartMinutes) {
    return [] as ExactBookableSlot[];
  }

  const startCandidates: number[] = [];
  for (
    let currentMinutes = windowStartMinutes;
    currentMinutes <= latestStartMinutes;
    currentMinutes += stepMinutes
  ) {
    startCandidates.push(currentMinutes);
  }

  if (startCandidates[startCandidates.length - 1] !== latestStartMinutes) {
    startCandidates.push(latestStartMinutes);
  }

  return startCandidates
    .map((serviceStartMinutes) => {
      const serviceEndMinutes = serviceStartMinutes + serviceDuration;
      const serviceStartTime = minutesToTime(serviceStartMinutes);
      const serviceEndTime = minutesToTime(serviceEndMinutes);

      return {
        id: `${dateIso}-${serviceStartTime}-${serviceEndTime}`,
        date: dateIso,
        windowStartTime: slot.startTime,
        windowEndTime: slot.endTime,
        serviceStartTime,
        serviceEndTime,
        travelBeforeMinutes: slot.travelBeforeMinutes ?? 0,
        travelAfterMinutes: slot.travelAfterMinutes ?? 0,
        fromLabel: slot.fromLabel ?? '',
        toLabel: slot.toLabel ?? '',
      } satisfies ExactBookableSlot;
    })
    .filter((slotCandidate) =>
      isExactSlotAfterEarliestAllowed(
        dateIso,
        slotCandidate.serviceStartTime,
        earliestAllowed,
      ),
    );
}

export function getExactBookableSlotsForDate(options: {
  dateIso: string;
  rawSlots: ClientBookingSlot[];
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
  stepMinutes?: number;
}) {
  const { dateIso, earliestAllowed, rawSlots, serviceDuration, stepMinutes } =
    options;

  return rawSlots.flatMap((slot) =>
    getExactBookableSlotsForWindow({
      dateIso,
      rawSlot: slot,
      serviceDuration,
      earliestAllowed,
      stepMinutes,
    }),
  );
}

export function getVisibleExactBookableSlotsForDate(options: {
  dateIso: string;
  rawSlots: ClientBookingSlot[];
  rawExactSlots?: ExactBookableSlot[] | null;
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
  stepMinutes?: number;
}) {
  const {
    dateIso,
    rawExactSlots,
    rawSlots,
    serviceDuration,
    earliestAllowed,
    stepMinutes,
  } = options;

  if (rawExactSlots) {
    return rawExactSlots
      .map(normalizeExactSlot)
      .filter((slot) =>
        isExactSlotAfterEarliestAllowed(
          dateIso,
          slot.serviceStartTime,
          earliestAllowed,
        ),
      );
  }

  return getExactBookableSlotsForDate({
    dateIso,
    rawSlots,
    serviceDuration,
    earliestAllowed,
    stepMinutes,
  });
}

export function getVisibleExactBookableSlotsForWindow(options: {
  dateIso: string;
  rawSlot: ClientBookingSlot;
  rawExactSlots?: ExactBookableSlot[] | null;
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
  stepMinutes?: number;
}) {
  const {
    dateIso,
    rawExactSlots,
    rawSlot,
    serviceDuration,
    earliestAllowed,
    stepMinutes,
  } = options;

  if (rawExactSlots) {
    return rawExactSlots
      .map(normalizeExactSlot)
      .filter(
        (slot) =>
          slot.windowStartTime === stripSeconds(rawSlot.startTime) &&
          slot.windowEndTime === stripSeconds(rawSlot.endTime),
      )
      .filter((slot) =>
        isExactSlotAfterEarliestAllowed(
          dateIso,
          slot.serviceStartTime,
          earliestAllowed,
        ),
      );
  }

  return getExactBookableSlotsForWindow({
    dateIso,
    rawSlot,
    serviceDuration,
    earliestAllowed,
    stepMinutes,
  });
}
