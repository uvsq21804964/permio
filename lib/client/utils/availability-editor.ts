import {
  clamp,
  DEFAULT_AVAILABILITY_MAX_MINUTES,
  DEFAULT_AVAILABILITY_MINUTES,
  DEFAULT_AVAILABILITY_STEP_MINUTES,
  minutesToTime,
  timeToMinutes,
} from '@/lib/client/utils/availability-time';

export type AvailabilityDraftLike = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type AvailabilityTimeRange = {
  startTime: string;
  endTime: string;
};

export function createInitialTimeRangeForHour(hour: number): AvailabilityTimeRange {
  const startMinutes = Math.max(
    DEFAULT_AVAILABILITY_MINUTES,
    Math.min(
      hour * 60,
      DEFAULT_AVAILABILITY_MAX_MINUTES - DEFAULT_AVAILABILITY_STEP_MINUTES
    )
  );
  const endMinutes = Math.min(startMinutes + 60, DEFAULT_AVAILABILITY_MAX_MINUTES);

  return {
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
  };
}

export function createEmptyTimeRange(): AvailabilityTimeRange {
  return { startTime: '05:00', endTime: '05:30' };
}

export function appendEmptyTimeRange(
  previous: AvailabilityTimeRange[]
): AvailabilityTimeRange[] {
  return [...previous, createEmptyTimeRange()];
}

export function removeTimeRangeAt(
  previous: AvailabilityTimeRange[],
  index: number
): AvailabilityTimeRange[] {
  return previous.length > 1
    ? previous.filter((_, currentIndex) => currentIndex !== index)
    : previous;
}

export function getAdjustedRangeAfterStartChange(
  currentRange: AvailabilityTimeRange,
  nextStartTime: string
): AvailabilityTimeRange {
  const nextStartMinutes = timeToMinutes(nextStartTime);
  const currentEndMinutes = timeToMinutes(currentRange.endTime);
  const minEnd = Math.min(
    nextStartMinutes + DEFAULT_AVAILABILITY_STEP_MINUTES,
    DEFAULT_AVAILABILITY_MAX_MINUTES
  );
  const nextEndMinutes = clamp(
    currentEndMinutes,
    minEnd,
    DEFAULT_AVAILABILITY_MAX_MINUTES
  );

  return {
    ...currentRange,
    startTime: nextStartTime,
    endTime: minutesToTime(nextEndMinutes),
  };
}

export function validateTimeRanges(
  timeRanges: AvailabilityTimeRange[],
  options: {
    rangeOrderMessage: (index: number) => string;
    rangeBoundsMessage: (index: number) => string;
    rangeStepMessage: (index: number) => string;
  }
): string | null {
  for (let index = 0; index < timeRanges.length; index += 1) {
    const { startTime, endTime } = timeRanges[index];
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return options.rangeOrderMessage(index + 1);
    }

    if (
      startMinutes < DEFAULT_AVAILABILITY_MINUTES ||
      endMinutes > DEFAULT_AVAILABILITY_MAX_MINUTES
    ) {
      return options.rangeBoundsMessage(index + 1);
    }

    if (
      startMinutes % DEFAULT_AVAILABILITY_STEP_MINUTES !== 0 ||
      endMinutes % DEFAULT_AVAILABILITY_STEP_MINUTES !== 0
    ) {
      return options.rangeStepMessage(index + 1);
    }
  }

  return null;
}

export function slotKey(availability: AvailabilityDraftLike): string {
  return `${availability.dayOfWeek}|${availability.startTime}|${availability.endTime}`;
}

export function isAvailabilityDraftDirty(
  saved: AvailabilityDraftLike[],
  draft: AvailabilityDraftLike[]
): boolean {
  const previous = new Set(saved.map(slotKey));
  const next = new Set(draft.map(slotKey));

  if (previous.size !== next.size) {
    return true;
  }

  for (const key of previous) {
    if (!next.has(key)) {
      return true;
    }
  }

  return false;
}

export function getAvailabilitiesForDay<T extends AvailabilityDraftLike>(
  list: T[],
  dayOfWeek: number
): T[] {
  return list.filter((entry) => entry.dayOfWeek === dayOfWeek);
}
