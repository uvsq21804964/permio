export type AvailabilitySlotLike = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type Meridiem = 'AM' | 'PM';

export const DEFAULT_AVAILABILITY_START_HOUR = 5;
export const DEFAULT_AVAILABILITY_END_HOUR = 23;
export const DEFAULT_AVAILABILITY_MINUTES =
  DEFAULT_AVAILABILITY_START_HOUR * 60;
export const DEFAULT_AVAILABILITY_MAX_MINUTES =
  DEFAULT_AVAILABILITY_END_HOUR * 60;
export const DEFAULT_AVAILABILITY_STEP_MINUTES = 5;

export function pad2(value: number) {
  return String(value).padStart(2, '0');
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  const safeHours = Number.isFinite(hours) ? hours : 0;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  return safeHours * 60 + safeMinutes;
}

export function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

export function isFrLocale(locale: string) {
  return locale === 'fr' || locale.startsWith('fr');
}

export function minutesToParts(totalMinutes: number) {
  const hh24 = Math.floor(totalMinutes / 60);
  const mm = totalMinutes % 60;
  const ampm: Meridiem = hh24 < 12 ? 'AM' : 'PM';
  const hh12 = ((hh24 + 11) % 12) + 1;

  return { hh24, mm, hh12, ampm };
}

export function partsToMinutes(hh12: number, mm: number, ampm: Meridiem) {
  const baseHour = hh12 % 12;
  const hh24 = ampm === 'AM' ? baseHour : baseHour + 12;
  return hh24 * 60 + mm;
}

export function nearestAllowed(target: number, allowed: number[]) {
  let best = allowed[0] ?? target;
  let bestDiff = Math.abs(best - target);

  for (const value of allowed) {
    const diff = Math.abs(value - target);
    if (diff < bestDiff) {
      best = value;
      bestDiff = diff;
    }
  }

  return best;
}

export function formatTimeForLocale(time: string, locale: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours || 0, minutes || 0, 0, 0);

  return new Intl.DateTimeFormat(isFrLocale(locale) ? 'fr-FR' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !isFrLocale(locale),
  }).format(date);
}

export function formatHourLabel(hour: number, locale: string): string {
  if (isFrLocale(locale)) {
    return `${pad2(hour)}:00`;
  }

  const date = new Date(2000, 0, 1, hour, 0, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(date);
}

export function mergeAvailabilities(
  list: AvailabilitySlotLike[],
): AvailabilitySlotLike[] {
  const byDay = new Map<number, AvailabilitySlotLike[]>();

  for (const availability of list) {
    const entries = byDay.get(availability.dayOfWeek) ?? [];
    entries.push(availability);
    byDay.set(availability.dayOfWeek, entries);
  }

  const merged: AvailabilitySlotLike[] = [];

  for (const [dayOfWeek, entries] of byDay.entries()) {
    const sorted = [...entries]
      .map((entry) => ({
        ...entry,
        startMinutes: timeToMinutes(entry.startTime),
        endMinutes: timeToMinutes(entry.endTime),
      }))
      .sort(
        (left, right) =>
          left.startMinutes - right.startMinutes ||
          left.endMinutes - right.endMinutes,
      );

    const mergedRanges: Array<{ startMinutes: number; endMinutes: number }> =
      [];

    for (const entry of sorted) {
      if (mergedRanges.length === 0) {
        mergedRanges.push({
          startMinutes: entry.startMinutes,
          endMinutes: entry.endMinutes,
        });
        continue;
      }

      const lastRange = mergedRanges[mergedRanges.length - 1];
      if (entry.startMinutes <= lastRange.endMinutes) {
        lastRange.endMinutes = Math.max(
          lastRange.endMinutes,
          entry.endMinutes,
        );
      } else {
        mergedRanges.push({
          startMinutes: entry.startMinutes,
          endMinutes: entry.endMinutes,
        });
      }
    }

    for (const range of mergedRanges) {
      merged.push({
        dayOfWeek,
        startTime: minutesToTime(range.startMinutes),
        endTime: minutesToTime(range.endMinutes),
      });
    }
  }

  return merged.sort(
    (left, right) =>
      left.dayOfWeek - right.dayOfWeek ||
      timeToMinutes(left.startTime) - timeToMinutes(right.startTime),
  );
}

export function getAvailabilityBlockStyle(
  startTime: string,
  endTime: string,
  options: {
    pixelsPerHour: number;
    startHour: number;
  },
) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOffsetMinutes = startMinutes - options.startHour * 60;
  const durationMinutes = endMinutes - startMinutes;

  return {
    top: (startOffsetMinutes / 60) * options.pixelsPerHour,
    height: (durationMinutes / 60) * options.pixelsPerHour,
  };
}

export function getAvailabilityDurationClass(
  startTime: string,
  endTime: string,
) {
  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (durationMinutes < 30) {
    return 'bg-emerald-50 border-emerald-300 text-emerald-900';
  }

  if (durationMinutes < 60) {
    return 'bg-blue-50 border-blue-300 text-blue-900';
  }

  if (durationMinutes < 120) {
    return 'bg-indigo-50 border-indigo-300 text-indigo-900';
  }

  return 'bg-purple-50 border-purple-300 text-purple-900';
}
