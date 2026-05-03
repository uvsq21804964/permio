export type TimeRange = {
  startTime: string;
  endTime: string;
};

export type MinuteRange = {
  start: number;
  end: number;
};

export type WeeklyAvailabilityInput = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type TimeRangeBounds = {
  min: number;
  max: number;
} | null;

export const DEFAULT_DAY_START_MINUTES = 8 * 60;
export const DEFAULT_DAY_END_MINUTES = 20 * 60;

export function isTimeString(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}

export function timeToMinutes(time: string): number {
  if (!isTimeString(time)) return Number.NaN;

  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function toMinuteRange(range: TimeRange): MinuteRange {
  return {
    start: timeToMinutes(range.startTime),
    end: timeToMinutes(range.endTime),
  };
}

export function overlapsOrIsAdjacent(
  left: TimeRange | MinuteRange,
  right: TimeRange | MinuteRange
): boolean {
  const leftRange = isMinuteRange(left) ? left : toMinuteRange(left);
  const rightRange = isMinuteRange(right) ? right : toMinuteRange(right);

  return leftRange.start <= rightRange.end && rightRange.start <= leftRange.end;
}

export function mergeMinuteRanges(ranges: MinuteRange[]): MinuteRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: MinuteRange[] = [{ ...sorted[0] }];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push({ ...current });
  }

  return merged;
}

export function subtractMinuteRanges(
  baseRanges: MinuteRange[],
  blockedRanges: MinuteRange[]
): MinuteRange[] {
  let remaining = [...baseRanges];

  for (const blocked of blockedRanges) {
    const next: MinuteRange[] = [];

    for (const current of remaining) {
      if (blocked.end <= current.start || blocked.start >= current.end) {
        next.push(current);
        continue;
      }

      if (blocked.start > current.start) {
        next.push({ start: current.start, end: blocked.start });
      }

      if (blocked.end < current.end) {
        next.push({ start: blocked.end, end: current.end });
      }
    }

    remaining = next;
  }

  return remaining;
}

export function validateTimeRange(
  range: TimeRange,
  bounds: TimeRangeBounds = {
    min: DEFAULT_DAY_START_MINUTES,
    max: DEFAULT_DAY_END_MINUTES,
  }
): { ok: true } | { ok: false; reason: string } {
  const start = timeToMinutes(range.startTime);
  const end = timeToMinutes(range.endTime);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { ok: false, reason: 'INVALID_TIME_FORMAT' };
  }

  if (end <= start) {
    return { ok: false, reason: 'INVALID_TIME_ORDER' };
  }

  if (bounds && (start < bounds.min || end > bounds.max)) {
    return { ok: false, reason: 'OUT_OF_ALLOWED_RANGE' };
  }

  return { ok: true };
}

export function mergeWeeklyAvailabilities(
  items: WeeklyAvailabilityInput[],
  options: { bounds?: TimeRangeBounds } = {}
): WeeklyAvailabilityInput[] {
  const grouped = new Map<number, MinuteRange[]>();

  for (const item of items) {
    const day = Number(item.dayOfWeek);
    const validation = validateTimeRange(item, options.bounds);

    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (!validation.ok) continue;

    const ranges = grouped.get(day) ?? [];
    ranges.push(toMinuteRange(item));
    grouped.set(day, ranges);
  }

  const merged: WeeklyAvailabilityInput[] = [];

  for (const [dayOfWeek, ranges] of grouped.entries()) {
    for (const range of mergeMinuteRanges(ranges)) {
      merged.push({
        dayOfWeek,
        startTime: minutesToTime(range.start),
        endTime: minutesToTime(range.end),
      });
    }
  }

  return merged.sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return left.dayOfWeek - right.dayOfWeek;
    }

    return timeToMinutes(left.startTime) - timeToMinutes(right.startTime);
  });
}

function isMinuteRange(value: TimeRange | MinuteRange): value is MinuteRange {
  return 'start' in value && 'end' in value;
}
