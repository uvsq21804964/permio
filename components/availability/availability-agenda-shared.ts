import {
  formatTimeForLocale,
  getAvailabilityDurationClass,
  timeToMinutes,
} from '@/lib/client/utils/availability-time';

export type AvailabilityAgendaUser = {
  id: string;
  name: string;
  role: string;
};

export type AvailabilityAgendaEntry = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  user?: {
    name: string | null;
    role: string | null;
  } | null;
};

export type AvailabilityAgendaHours = {
  plannedMinutes: number | null;
  remainingMinutes: number | null;
};

export function getDurationColor(startTime: string, endTime: string) {
  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  const baseClass = getAvailabilityDurationClass(startTime, endTime);

  if (durationMinutes < 30) {
    return `${baseClass} hover:bg-emerald-100`;
  }

  if (durationMinutes < 60) {
    return `${baseClass} hover:bg-blue-100`;
  }

  if (durationMinutes < 120) {
    return `${baseClass} hover:bg-indigo-100`;
  }

  return `${baseClass} hover:bg-purple-100`;
}

export function formatQty(minutes?: number | null): string {
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) {
    return '-';
  }

  if (minutes < 0) {
    return '0 min';
  }

  if (minutes % 30 === 0) {
    const hours = minutes / 60;
    return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
  }

  return `${minutes} min`;
}

export function formatAvailabilityTooltip(
  availability: AvailabilityAgendaEntry,
  locale: string
): string {
  return `${formatTimeForLocale(availability.startTime, locale)} - ${formatTimeForLocale(
    availability.endTime,
    locale
  )}`;
}
