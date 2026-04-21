import {
  minutesToTime,
  timeToMinutes,
  type ServiceAlignment,
} from '@/lib/client/utils/booking';

export type SelectedBookingService = {
  id: number;
  name: string;
  categoryName: string;
  durationMinutes: number | null;
  isRemote: boolean;
};

export type SelectedBookingSlot = {
  date: string;
  windowStartTime: string;
  windowEndTime: string;
  serviceStartTime: string;
  serviceEndTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
  alignment: ServiceAlignment;
};

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
};

type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type DayException = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: 'available' | 'unavailable';
};

type BookedSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type WeeklyAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  instructor: {
    id: string;
    name: string | null;
    role: string;
    formatted_address: string | null;
    lat: number | null;
    lng: number | null;
    street: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    country_code: string | null;
    google_place_id: string | null;
    raw_input: string | null;
    address_label: string | null;
    is_primary: boolean;
  };
  client: {
    id: string;
    name: string | null;
    role: string;
    formatted_address: string | null;
    lat: number | null;
    lng: number | null;
    street: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    country_code: string | null;
    google_place_id: string | null;
    raw_input: string | null;
    address_label: string | null;
    is_primary: boolean;
  };
  defaults: DefaultAvailability[];
  exceptions: DayException[];
  bookedSlots: BookedSlot[];
  clientSlotsByDate: Record<string, ClientBookingSlot[]>;
};

export const START_HOUR = 8;
export const END_HOUR = 20;
export const PIXELS_PER_HOUR = 60;
export const EXACT_BOOKING_STEP_MINUTES = 5;
export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, index) => index + START_HOUR
);

export function stripSeconds(time: string) {
  const parts = time.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }

  return time;
}

export function isFrLocale(locale: string) {
  return locale === 'fr' || locale.startsWith('fr');
}

export function formatTimeForLocale(time: string, locale: string): string {
  const clean = stripSeconds(time);
  const [hour, minute] = clean.split(':').map(Number);
  const date = new Date(2000, 0, 1, hour || 0, minute || 0, 0, 0);
  const intlLocale = isFrLocale(locale) ? 'fr-FR' : 'en-US';

  return new Intl.DateTimeFormat(intlLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !isFrLocale(locale),
  }).format(date);
}

export function formatHourLabel(hour: number, locale: string): string {
  if (isFrLocale(locale)) {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  const date = new Date(2000, 0, 1, hour, 0, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: true,
  }).format(date);
}

function isoToDateOnly(iso: string): Date {
  const base = iso.slice(0, 10);
  const [year, month, day] = base.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDayMonth(date: Date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function formatShortDateFromISO(iso: string, locale: string): string {
  const date = isoToDateOnly(iso);
  return isFrLocale(locale) ? formatDayMonth(date) : formatMonthDay(date);
}

export function formatWeekdayShortFromISO(iso: string, locale: string): string {
  const date = isoToDateOnly(iso);
  const weekdayLocale = isFrLocale(locale) ? 'fr-FR' : 'en-US';
  return date.toLocaleDateString(weekdayLocale, { weekday: 'short' });
}

export function formatDayAndDate(iso: string, locale: string): string {
  return `${formatWeekdayShortFromISO(iso, locale)} ${formatShortDateFromISO(
    iso,
    locale
  )}`;
}

export function dateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfWeekMondayISO(base?: string): string {
  const date = base ? isoToDateOnly(base) : new Date();
  const dayOfWeek = date.getDay();
  const isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  date.setDate(date.getDate() - (isoDayOfWeek - 1));
  date.setHours(0, 0, 0, 0);
  return dateToISO(date);
}

export function addDaysISO(iso: string, delta: number): string {
  const date = isoToDateOnly(iso);
  date.setDate(date.getDate() + delta);
  return dateToISO(date);
}

export function getBlockStyle(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const offsetFromStart = startMinutes - START_HOUR * 60;
  const duration = endMinutes - startMinutes;

  return {
    top: (offsetFromStart / 60) * PIXELS_PER_HOUR,
    height: (duration / 60) * PIXELS_PER_HOUR,
  };
}

export function getAvailableSlotTone() {
  return 'bg-amber-50 border-amber-200 text-amber-950';
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
  serviceDuration: number | null | undefined
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
  earliestAllowed: Date
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
    0
  );

  return slotDateTime >= earliestAllowed;
}

function isExactSlotAfterEarliestAllowed(
  dateIso: string,
  serviceStartTime: string,
  earliestAllowed: Date
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
    0
  );

  return slotDateTime >= earliestAllowed;
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
      };
    })
    .filter((slotCandidate) =>
      isExactSlotAfterEarliestAllowed(
        dateIso,
        slotCandidate.serviceStartTime,
        earliestAllowed
      )
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
    })
  );
}

export function computeDisabledDays(options: {
  data: WeeklyAgendaResponse | null;
  weekDates: string[];
  serviceDuration: number | null | undefined;
  earliestAllowed: Date;
}) {
  const { data, earliestAllowed, serviceDuration, weekDates } = options;
  const result: Record<string, boolean> = {};

  if (!data) {
    return result;
  }

  for (const dateIso of weekDates) {
    const exactSlots = getExactBookableSlotsForDate({
      dateIso,
      rawSlots: data.clientSlotsByDate?.[dateIso] ?? [],
      serviceDuration,
      earliestAllowed,
    });
    result[dateIso] = exactSlots.length === 0;
  }

  return result;
}
