import {
  formatTimeForLocale,
  getAvailabilityDurationClass,
} from '@/lib/client/utils/availability-time';

export type AssociateAgencyAvailabilityEntry = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export function getAssociateAvailabilityBlockColor(
  availability: AssociateAgencyAvailabilityEntry
) {
  return getAvailabilityDurationClass(
    availability.startTime,
    availability.endTime
  );
}

export function formatAssociateAvailabilityTooltip(
  availability: AssociateAgencyAvailabilityEntry,
  locale: string
) {
  return `${formatTimeForLocale(availability.startTime, locale)} - ${formatTimeForLocale(
    availability.endTime,
    locale
  )}`;
}
