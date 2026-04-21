import type { BookingAddressPayload } from '@/lib/client/api/booking-client';

export type ServiceAlignment = 'start' | 'end';

export type BookingAddress = BookingAddressPayload;

export function timeToMinutes(time: string): number {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function addMinutesToTime(time: string, deltaMinutes: number): string {
  return minutesToTime(timeToMinutes(time) + deltaMinutes);
}

export function getEarliestAllowedDateTime(now: Date = new Date()): Date {
  const ref = new Date(now);
  ref.setSeconds(0, 0);

  const hour = ref.getHours() + ref.getMinutes() / 60;
  const earliest = new Date(ref);

  if (hour < 10) {
    earliest.setHours(12, 0, 0, 0);
  } else if (hour < 16) {
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(10, 0, 0, 0);
  } else {
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(12, 0, 0, 0);
  }

  return earliest;
}

export function computeServiceTimes(
  windowStartTime: string,
  windowEndTime: string,
  serviceDuration: number,
  alignment: ServiceAlignment,
) {
  const windowStartM = timeToMinutes(windowStartTime);
  const windowEndM = timeToMinutes(windowEndTime);

  let serviceStartM = windowStartM;
  let serviceEndM = windowEndM;

  if (alignment === 'start') {
    serviceStartM = windowStartM;
    serviceEndM = windowStartM + serviceDuration;
    if (serviceEndM > windowEndM) {
      serviceEndM = windowEndM;
      serviceStartM = windowEndM - serviceDuration;
    }
  } else {
    serviceEndM = windowEndM;
    serviceStartM = windowEndM - serviceDuration;
    if (serviceStartM < windowStartM) {
      serviceStartM = windowStartM;
      serviceEndM = windowStartM + serviceDuration;
    }
  }

  return {
    serviceStartTime: minutesToTime(serviceStartM),
    serviceEndTime: minutesToTime(serviceEndM),
  };
}

export function parseBookingAddressParam(
  addressParam: string | null,
  onError?: (error: unknown) => void,
): BookingAddress | null {
  if (!addressParam) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(addressParam)) as BookingAddress;
  } catch (error) {
    onError?.(error);
    return null;
  }
}

export function toBookingAddressPayload(
  bookingAddress: BookingAddress | null | undefined,
): BookingAddressPayload | undefined {
  if (!bookingAddress) {
    return undefined;
  }

  return {
    formattedAddress: bookingAddress.formattedAddress,
    lat: bookingAddress.lat,
    lng: bookingAddress.lng,
    street: bookingAddress.street,
    streetNumber: bookingAddress.streetNumber,
    postalCode: bookingAddress.postalCode,
    city: bookingAddress.city,
    country: bookingAddress.country,
    countryCode: bookingAddress.countryCode,
    googlePlaceId: bookingAddress.googlePlaceId,
  };
}
