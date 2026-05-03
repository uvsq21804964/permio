import { requestJson } from '@/lib/client/api/request';
import type { DayAvailability, DefaultAvailability } from '@/types/availability';

export type BookingAddressPayload = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  googlePlaceId?: string;
};

type AgendaParticipant = {
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

export type AgendaClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

export type AgendaBookedSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type InstructorAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  instructor?: AgendaParticipant;
  client?: AgendaParticipant;
  defaults?: DefaultAvailability[];
  exceptions?: DayAvailability[];
  bookedSlots?: AgendaBookedSlot[];
  clientSlotsByDate: Record<string, AgendaClientSlot[]>;
};

type BookingErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

type AgendaQuery = {
  weekStart?: string;
  isRemote?: boolean;
  bookingAddress?: BookingAddressPayload | null;
  clientUserId?: string | null;
};

export type CreateBookingSlotInput = {
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  bookingAddress?: BookingAddressPayload;
  clientUserId?: string | null;
};

function buildAgendaUrl(path: string, query: AgendaQuery): string {
  const params = new URLSearchParams();
  if (query.weekStart) {
    params.set('weekStart', query.weekStart);
  }

  if (query.clientUserId) {
    params.set('clientUserId', query.clientUserId);
  }

  if (query.isRemote) {
    params.set('isRemote', '1');
  } else if (query.bookingAddress) {
    params.set('clientLat', String(query.bookingAddress.lat));
    params.set('clientLng', String(query.bookingAddress.lng));
    params.set('clientFormatted', query.bookingAddress.formattedAddress);
  }

  return `${path}?${params.toString()}`;
}

export function getInstructorWeeklyAgenda(
  query: AgendaQuery,
  options?: { fallbackMessage?: string },
) {
  return requestJson<InstructorAgendaResponse, BookingErrorBody>(
    buildAgendaUrl('/api/me/instructor-weekly-agenda', query),
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to fetch instructor weekly agenda',
    },
  );
}

export function getInstructorWeeklyAgendaProposals(
  query: AgendaQuery,
  options?: { fallbackMessage?: string },
) {
  return requestJson<InstructorAgendaResponse, BookingErrorBody>(
    buildAgendaUrl('/api/me/instructor-weekly-agenda-proposals', query),
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ??
        'Failed to fetch instructor proposal agenda',
    },
  );
}

export function createBookingSlot(
  payload: CreateBookingSlotInput,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ slot: unknown }, BookingErrorBody>('/api/slots', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(payload),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to create booking',
  });
}
