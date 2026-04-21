import {
  minutesToTime,
  overlapsOrIsAdjacent,
  timeToMinutes,
  validateTimeRange,
  type TimeRange,
} from '@/lib/server/domain/time-ranges';
import type { DayAvailabilityKind } from '@/lib/server/repositories/availability-repository';

export type CreateWeeklyAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type CreateDayAvailabilityInput = {
  date: string;
  startTime: string;
  endTime: string;
  kind: DayAvailabilityKind;
};

export function validateWeeklyAvailabilityInput(
  input: CreateWeeklyAvailabilityInput
): { ok: true } | { ok: false; error: string } {
  if (
    typeof input.dayOfWeek !== 'number' ||
    input.dayOfWeek < 0 ||
    input.dayOfWeek > 6 ||
    !input.startTime ||
    !input.endTime
  ) {
    return { ok: false, error: 'Missing or invalid dayOfWeek, startTime or endTime' };
  }

  const rangeValidation = validateTimeRange(input);
  if (!rangeValidation.ok) {
    return mapTimeValidation(rangeValidation.reason, 'weekly');
  }

  return { ok: true };
}

export function validateDayAvailabilityInput(
  input: CreateDayAvailabilityInput
): { ok: true } | { ok: false; error: string } {
  if (!input.date || !input.startTime || !input.endTime || !input.kind) {
    return { ok: false, error: 'date, startTime, endTime et kind sont requis' };
  }

  if (!['available', 'unavailable'].includes(input.kind)) {
    return { ok: false, error: 'kind doit être "available" ou "unavailable"' };
  }

  const rangeValidation = validateTimeRange(input);
  if (!rangeValidation.ok) {
    return mapTimeValidation(rangeValidation.reason, 'day');
  }

  return { ok: true };
}

export function mergeWithExistingRanges(
  requestedRange: TimeRange,
  existingRanges: Array<{ id: string; startTime: string; endTime: string }>
) {
  const overlapping = existingRanges.filter((range) =>
    overlapsOrIsAdjacent(requestedRange, {
      startTime: range.startTime,
      endTime: range.endTime,
    })
  );

  if (overlapping.length === 0) {
    return {
      startTime: requestedRange.startTime,
      endTime: requestedRange.endTime,
      mergedIds: [] as string[],
    };
  }

  const allTimes = [
    {
      start: requestedRange.startTime,
      end: requestedRange.endTime,
    },
    ...overlapping.map((range) => ({
      start: range.startTime,
      end: range.endTime,
    })),
  ];

  const minStart = Math.min(...allTimes.map((item) => timeToMinutes(item.start)));
  const maxEnd = Math.max(...allTimes.map((item) => timeToMinutes(item.end)));

  return {
    startTime: minutesToTime(minStart),
    endTime: minutesToTime(maxEnd),
    mergedIds: overlapping.map((range) => range.id),
  };
}

function mapTimeValidation(reason: string, context: 'weekly' | 'day') {
  if (reason === 'INVALID_TIME_ORDER') {
    return {
      ok: false as const,
      error: "L'heure de fin doit être après l'heure de début",
    };
  }

  if (reason === 'OUT_OF_ALLOWED_RANGE') {
    return {
      ok: false as const,
      error: 'Les horaires doivent être entre 8h00 et 20h00',
    };
  }

  return {
    ok: false as const,
    error:
      context === 'day'
        ? 'date, startTime, endTime et kind sont requis'
        : 'Missing or invalid dayOfWeek, startTime or endTime',
  };
}
