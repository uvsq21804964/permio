import { inngest } from '@/src/lib/inngest/client';

import { timeToMinutes } from '@/lib/server/domain/time-ranges';
import {
  getAgencyById,
  type AgencyRecord,
} from '@/lib/server/repositories/agency-repository';
import {
  insertSlot,
  type SlotAddressSource,
  type SlotRecord,
} from '@/lib/server/repositories/slot-repository';
import {
  getFirstAgencyInstructor,
  getUserById,
  type AppUserRecord,
} from '@/lib/server/repositories/user-repository';
import { getServicePricingByIdForUser } from '@/lib/server/repositories/service-repository';
import { devLogger } from '@/lib/shared/dev-logger';

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

export type CreateSlotInput = {
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  bookingAddress?: BookingAddressPayload;
  clientUserId?: string | null;
  locale?: 'fr' | 'en';
};

type BookingLocale = 'fr' | 'en';

function toBookingLocale(locale?: string | null): BookingLocale {
  return locale?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

type SlotBookingEventPayload = {
  id: string;
  name: 'slot/booked-instructor' | 'slot/booked-client';
  data: {
    slotId: number;
    agencyId: string;
    agencyName: string | null;
    organizationId: string | null;
    instructorUserId: string;
    clientUserId: string;
    serviceId: number;
    date: string;
    startTime: string;
    endTime: string;
    locale: BookingLocale;
  };
};

type CreateSlotServiceResult =
  | { ok: true; status: 201; body: { slot: SlotRecord } }
  | { ok: false; status: 400; body: { error: string } }
  | { ok: false; status: 403; body: { error: string } }
  | { ok: false; status: 404; body: { error: string } }
  | { ok: false; status: 409; body: { error: string } }
  | { ok: false; status: 500; body: { error: string; detail?: string } };

type ValidateCreateSlotInputResult =
  | {
      ok: true;
      value: CreateSlotInput & { durationMinutes: number };
    }
  | {
      ok: false;
      status: 400;
      body: { error: string };
    };

function validateCreateSlotInput(body: unknown): ValidateCreateSlotInputResult {
  const payload = (body ?? {}) as Partial<CreateSlotInput>;
  const { serviceId, date, startTime, endTime } = payload;

  if (
    !serviceId ||
    typeof serviceId !== 'number' ||
    !date ||
    !startTime ||
    !endTime
  ) {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'MISSING_OR_INVALID_FIELDS' },
    };
  }

  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (durationMinutes <= 0) {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'INVALID_TIME_RANGE' },
    };
  }

  return {
    ok: true as const,
    value: {
      serviceId,
      date,
      startTime,
      endTime,
      bookingAddress: payload.bookingAddress,
      clientUserId:
        typeof payload.clientUserId === 'string' &&
        payload.clientUserId.trim().length > 0
          ? payload.clientUserId.trim()
          : null,
      durationMinutes,
    },
  };
}

function buildAddressSource(
  client: AppUserRecord,
  bookingAddress?: BookingAddressPayload,
): SlotAddressSource {
  if (bookingAddress) {
    return {
      formatted_address: bookingAddress.formattedAddress,
      lat: bookingAddress.lat,
      lng: bookingAddress.lng,
      street: bookingAddress.street || null,
      street_number: bookingAddress.streetNumber || null,
      postal_code: bookingAddress.postalCode || null,
      city: bookingAddress.city || null,
      country: bookingAddress.country || null,
      country_code: bookingAddress.countryCode || null,
      google_place_id: bookingAddress.googlePlaceId ?? null,
      raw_input: bookingAddress.formattedAddress,
      address_label: client.address_label ?? null,
      is_primary: false,
    };
  }

  return {
    formatted_address: client.formatted_address ?? null,
    lat: client.lat ?? null,
    lng: client.lng ?? null,
    street: client.street ?? null,
    street_number: client.street_number ?? null,
    postal_code: client.postal_code ?? null,
    city: client.city ?? null,
    country: client.country ?? null,
    country_code: client.country_code ?? null,
    google_place_id: client.google_place_id ?? null,
    raw_input: client.raw_input ?? null,
    address_label: client.address_label ?? null,
    is_primary: client.is_primary ?? true,
  };
}

function buildRemoteAddressSource(): SlotAddressSource {
  return {
    formatted_address: null,
    lat: null,
    lng: null,
    street: null,
    street_number: null,
    postal_code: null,
    city: null,
    country: null,
    country_code: null,
    google_place_id: null,
    raw_input: null,
    address_label: null,
    is_primary: false,
  };
}

async function resolveInstructorForBooking(client: AppUserRecord) {
  if (client.role === 'instructor') {
    return client;
  }

  if (!client.agencyId) {
    return null;
  }

  return getFirstAgencyInstructor(client.agencyId);
}

async function resolveBookingParticipants(params: {
  actor: AppUserRecord;
  targetClientUserId: string | null;
}): Promise<
  | { ok: true; instructor: AppUserRecord; client: AppUserRecord }
  | { ok: false; status: 400 | 403 | 404; body: { error: string } }
> {
  const { actor, targetClientUserId } = params;

  if (!targetClientUserId) {
    const instructor = await resolveInstructorForBooking(actor);
    if (!instructor) {
      return {
        ok: false,
        status: 400,
        body: { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
      };
    }

    return { ok: true, instructor, client: actor };
  }

  if (actor.role !== 'instructor' && actor.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      body: { error: 'FORBIDDEN_CLIENT_BOOKING_DELEGATION' },
    };
  }

  if (!actor.agencyId) {
    return { ok: false, status: 400, body: { error: 'AGENCY_NOT_FOUND' } };
  }

  const targetClient = await getUserById(targetClientUserId);
  if (!targetClient) {
    return { ok: false, status: 404, body: { error: 'CLIENT_NOT_FOUND' } };
  }

  if (
    targetClient.role !== 'student' ||
    targetClient.agencyId !== actor.agencyId
  ) {
    return {
      ok: false,
      status: 403,
      body: { error: 'CLIENT_NOT_IN_AGENCY' },
    };
  }

  if (actor.role === 'instructor') {
    return { ok: true, instructor: actor, client: targetClient };
  }

  const instructor = await getFirstAgencyInstructor(actor.agencyId);
  if (!instructor) {
    return {
      ok: false,
      status: 400,
      body: { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
    };
  }

  return { ok: true, instructor, client: targetClient };
}

function buildBookingEventPayload(params: {
  slot: SlotRecord;
  agency: AgencyRecord;
  instructorUserId: string;
  clientUserId: string;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  locale: BookingLocale;
}) {
  const {
    slot,
    agency,
    instructorUserId,
    clientUserId,
    serviceId,
    date,
    startTime,
    endTime,
    locale,
  } = params;

  const commonData = {
    slotId: slot.id,
    agencyId: agency.id,
    agencyName: agency.name,
    organizationId: agency.clerk_org_id,
    instructorUserId,
    clientUserId,
    serviceId,
    date,
    startTime,
    endTime,
    locale,
  };

  return {
    instructor: {
      id: `slot:${slot.id}:instructor-booked`,
      name: 'slot/booked-instructor',
      data: commonData,
    } satisfies SlotBookingEventPayload,
    client: {
      id: `slot:${slot.id}:client-booked`,
      name: 'slot/booked-client',
      data: commonData,
    } satisfies SlotBookingEventPayload,
  };
}

async function emitBookingEvent(
  label: 'Instructor booking' | 'Client booking',
  payload: SlotBookingEventPayload,
) {
  try {
    devLogger.info(`[slot-booking] emit ${label}`, payload);
    await inngest.send(payload);
  } catch (error) {
    console.error(`[slot-booking] failed to emit ${label} event`, error);
  }
}

export async function createSlotBooking(params: {
  userId: string;
  input: CreateSlotInput;
  locale?: string | null;
}): Promise<CreateSlotServiceResult> {
  const { userId, input } = params;
  const locale = toBookingLocale(params.locale);
  const validation = validateCreateSlotInput(input);

  if (!validation.ok) {
    return validation;
  }

  const {
    serviceId,
    date,
    startTime,
    endTime,
    bookingAddress,
    clientUserId,
    durationMinutes,
  } = validation.value;

  const actor = await getUserById(userId);
  if (!actor) {
    return { ok: false, status: 404, body: { error: 'USER_NOT_FOUND' } };
  }

  const participants = await resolveBookingParticipants({
    actor,
    targetClientUserId: clientUserId ?? null,
  });
  if (!participants.ok) {
    return participants;
  }

  const { instructor, client } = participants;
  if (!instructor.agencyId) {
    return { ok: false, status: 400, body: { error: 'AGENCY_NOT_FOUND' } };
  }

  const agency = await getAgencyById(instructor.agencyId);
  if (!agency) {
    return { ok: false, status: 400, body: { error: 'AGENCY_NOT_FOUND' } };
  }

  const service = await getServicePricingByIdForUser({
    serviceId,
    userId: instructor.id,
  });
  if (!service) {
    return { ok: false, status: 404, body: { error: 'SERVICE_NOT_FOUND' } };
  }

  const addressSource = service.is_remote
    ? buildRemoteAddressSource()
    : buildAddressSource(client, bookingAddress);

  try {
    const slot = await insertSlot({
      instructorUserId: instructor.id,
      clientUserId: client.id,
      serviceId,
      date,
      startTime,
      endTime,
      durationMinutes,
      addressSource,
    });

    const events = buildBookingEventPayload({
      slot,
      agency,
      instructorUserId: instructor.id,
      clientUserId: client.id,
      serviceId,
      date,
      startTime,
      endTime,
      locale,
    });

    await emitBookingEvent('Instructor booking', events.instructor);
    await emitBookingEvent('Client booking', events.client);

    return { ok: true, status: 201, body: { slot } };
  } catch (error: any) {
    if (error?.code === '23505') {
      return { ok: false, status: 409, body: { error: 'SLOT_ALREADY_EXISTS' } };
    }

    console.error('[slot-booking] create slot failed', error);
    return {
      ok: false,
      status: 500,
      body: { error: 'FAILED_TO_CREATE_SLOT' },
    };
  }
}
