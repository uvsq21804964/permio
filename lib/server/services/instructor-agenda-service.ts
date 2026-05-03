import {
  mergeMinuteRanges,
  minutesToTime,
  subtractMinuteRanges,
  timeToMinutes,
  type MinuteRange,
  type TimeRange,
} from '@/lib/server/domain/time-ranges';
import {
  addDaysISO,
  dateToISO,
  isoToDateOnly,
  startOfWeekMondayISO,
} from '@/lib/server/services/agenda-date';
import {
  getAgendaUserById,
  getFirstAgencyInstructorForAgenda,
  listInstructorBookedSlots,
  listInstructorDayExceptions,
  listInstructorDefaultAvailabilities,
  type InstructorAgendaBookedSlot,
  type InstructorAgendaDayException,
  type InstructorAgendaDefaultAvailability,
  type InstructorAgendaUserRow,
} from '@/lib/server/repositories/instructor-agenda-repository';
import {
  createTravelDurationCache,
  getTravelDurationMinutesWithCache,
  type TravelPoint,
} from '@/lib/server/services/agenda-travel';
import { sortTimedSlots } from '@/lib/server/services/agenda-slot-utils';
import { devLogger } from '@/lib/shared/dev-logger';

type ClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

type AgendaResponseUser = {
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

export type InstructorAgendaPayload = {
  weekStart: string;
  weekEnd: string;
  instructor: AgendaResponseUser;
  client: AgendaResponseUser;
  defaults: InstructorAgendaDefaultAvailability[];
  exceptions: InstructorAgendaDayException[];
  bookedSlots: InstructorAgendaBookedSlot[];
  clientSlotsByDate: Record<string, ClientSlot[]>;
};

type AgendaServiceResult =
  | { ok: true; payload: InstructorAgendaPayload }
  | { ok: false; status: number; body: { error: string } };

export { addDaysISO, dateToISO, isoToDateOnly, startOfWeekMondayISO };

function getIsoDayOfWeekIndex(iso: string): number {
  const date = isoToDateOnly(iso);
  const jsDow = date.getDay();
  return (jsDow === 0 ? 7 : jsDow) - 1;
}

function buildAvailableSlotsForDay(
  defaultsForDay: InstructorAgendaDefaultAvailability[],
  exceptionsForDay: InstructorAgendaDayException[],
): TimeRange[] {
  const defaultIntervals: MinuteRange[] = defaultsForDay.map((availability) => ({
    start: timeToMinutes(availability.startTime),
    end: timeToMinutes(availability.endTime),
  }));

  const extraAvailabilities: MinuteRange[] = exceptionsForDay
    .filter((entry) => entry.kind === 'available')
    .map((entry) => ({
      start: timeToMinutes(entry.startTime),
      end: timeToMinutes(entry.endTime),
    }));

  const unavailableRanges: MinuteRange[] = exceptionsForDay
    .filter((entry) => entry.kind === 'unavailable')
    .map((entry) => ({
      start: timeToMinutes(entry.startTime),
      end: timeToMinutes(entry.endTime),
    }));

  const base = mergeMinuteRanges([...defaultIntervals, ...extraAvailabilities]);
  const withoutUnavailable = subtractMinuteRanges(base, unavailableRanges);
  const finalRanges = mergeMinuteRanges(withoutUnavailable);

  return finalRanges.map((range) => ({
    startTime: minutesToTime(range.start),
    endTime: minutesToTime(range.end),
  }));
}

function subtractBookedSlots(
  slots: TimeRange[],
  booked: InstructorAgendaBookedSlot[],
): TimeRange[] {
  if (!booked.length) return slots;

  const baseIntervals: MinuteRange[] = slots.map((slot) => ({
    start: timeToMinutes(slot.startTime),
    end: timeToMinutes(slot.endTime),
  }));
  const bookedIntervals: MinuteRange[] = booked.map((slot) => ({
    start: timeToMinutes(slot.startTime),
    end: timeToMinutes(slot.endTime),
  }));

  const remaining = subtractMinuteRanges(
    baseIntervals,
    mergeMinuteRanges(bookedIntervals),
  );

  return remaining.map((range) => ({
    startTime: minutesToTime(range.start),
    endTime: minutesToTime(range.end),
  }));
}

function toTravelPoint(params: {
  lat: number | null;
  lng: number | null;
  formatted_address: string | null;
}): TravelPoint {
  return {
    lat: params.lat,
    lng: params.lng,
    formatted_address: params.formatted_address,
  };
}

function buildNeighborPoint(slot: InstructorAgendaBookedSlot): TravelPoint {
  return toTravelPoint({
    lat: slot.lat,
    lng: slot.lng,
    formatted_address: slot.formatted_address,
  });
}

function findPreviousBookedSlot(
  bookedForDay: InstructorAgendaBookedSlot[],
  freeStartMinutes: number,
): InstructorAgendaBookedSlot | null {
  let previous: InstructorAgendaBookedSlot | null = null;

  for (const slot of bookedForDay) {
    if (timeToMinutes(slot.endTime) <= freeStartMinutes) {
      previous = slot;
      continue;
    }
    break;
  }

  return previous;
}

function findNextBookedSlot(
  bookedForDay: InstructorAgendaBookedSlot[],
  freeEndMinutes: number,
): InstructorAgendaBookedSlot | null {
  for (const slot of bookedForDay) {
    if (timeToMinutes(slot.startTime) >= freeEndMinutes) {
      return slot;
    }
  }

  return null;
}

async function buildClientSlotsByDate(params: {
  startDate: string;
  endDate: string;
  defaults: InstructorAgendaDefaultAvailability[];
  exceptions: InstructorAgendaDayException[];
  bookedSlots: InstructorAgendaBookedSlot[];
  instructor: InstructorAgendaUserRow;
  client: InstructorAgendaUserRow;
}): Promise<Record<string, ClientSlot[]>> {
  const {
    startDate,
    endDate,
    defaults,
    exceptions,
    bookedSlots,
    instructor,
    client,
  } = params;

  const cache = createTravelDurationCache();
  const result: Record<string, ClientSlot[]> = {};
  const instructorPoint = toTravelPoint({
    lat: instructor.lat,
    lng: instructor.lng,
    formatted_address: instructor.formatted_address,
  });
  const clientPoint = toTravelPoint({
    lat: client.lat,
    lng: client.lng,
    formatted_address: client.formatted_address,
  });

  let cursor = isoToDateOnly(startDate);
  const end = isoToDateOnly(endDate);

  while (cursor.getTime() <= end.getTime()) {
    const dateIso = dateToISO(cursor);
    const dayIndex = getIsoDayOfWeekIndex(dateIso);

    const defaultsForDay = defaults.filter(
      (availability) => availability.dayOfWeek === dayIndex,
    );
    const exceptionsForDay = exceptions.filter((entry) => entry.date === dateIso);
    const baseAvailableSlots = buildAvailableSlotsForDay(
      defaultsForDay,
      exceptionsForDay,
    );
    const bookedForDay = sortTimedSlots(
      bookedSlots.filter((slot) => slot.date === dateIso),
    );
    const freeSlots = subtractBookedSlots(baseAvailableSlots, bookedForDay);

    devLogger.log('--- [DAY]', dateIso, '---');
    devLogger.log('[DAY] baseAvailableSlots', baseAvailableSlots);
    devLogger.log(
      '[DAY] bookedForDay',
      bookedForDay.map((slot) => ({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        formatted_address: slot.formatted_address,
      })),
    );
    devLogger.log('[DAY] freeSlots', freeSlots);

    const clientSlotsForDay: ClientSlot[] = [];

    for (const freeSlot of freeSlots) {
      const freeStartMinutes = timeToMinutes(freeSlot.startTime);
      const freeEndMinutes = timeToMinutes(freeSlot.endTime);
      if (freeEndMinutes <= freeStartMinutes) continue;

      const previousSlot = findPreviousBookedSlot(bookedForDay, freeStartMinutes);
      const nextSlot = findNextBookedSlot(bookedForDay, freeEndMinutes);
      const previousPoint = previousSlot
        ? buildNeighborPoint(previousSlot)
        : instructorPoint;
      const nextPoint = nextSlot ? buildNeighborPoint(nextSlot) : instructorPoint;

      const travelBefore =
        (await getTravelDurationMinutesWithCache(
          previousPoint,
          clientPoint,
          cache,
        )) ?? 0;
      const travelAfter =
        (await getTravelDurationMinutesWithCache(
          clientPoint,
          nextPoint,
          cache,
        )) ?? 0;

      const totalTravel = travelBefore + travelAfter;
      const clientStartMinutes = freeStartMinutes + travelBefore;
      const clientEndMinutes = freeEndMinutes - travelAfter;

      devLogger.log('[SLOT DEBUG]', {
        date: dateIso,
        freeSlot,
        prevSlot: previousSlot
          ? {
              id: previousSlot.id,
              startTime: previousSlot.startTime,
              endTime: previousSlot.endTime,
              formatted_address: previousSlot.formatted_address,
            }
          : 'DOMICILE_INSTRUCTOR',
        nextSlot: nextSlot
          ? {
              id: nextSlot.id,
              startTime: nextSlot.startTime,
              endTime: nextSlot.endTime,
              formatted_address: nextSlot.formatted_address,
            }
          : 'DOMICILE_INSTRUCTOR',
        travelBeforeMinutes: travelBefore,
        travelAfterMinutes: travelAfter,
        totalTravelMinutes: totalTravel,
        clientWindowRaw: {
          startMinutes: clientStartMinutes,
          endMinutes: clientEndMinutes,
        },
        clientWindowTime: {
          startTime: minutesToTime(clientStartMinutes),
          endTime: minutesToTime(clientEndMinutes),
        },
      });

      if (freeEndMinutes - freeStartMinutes <= totalTravel) {
        devLogger.log('[SLOT DEBUG] rejected: not enough room for travel', {
          date: dateIso,
          freeSlot,
          totalTravelMinutes: totalTravel,
          freeDurationMinutes: freeEndMinutes - freeStartMinutes,
        });
        continue;
      }

      if (clientEndMinutes <= clientStartMinutes) {
        devLogger.log('[SLOT DEBUG] rejected: empty client window', {
          date: dateIso,
          clientWindowTime: {
            startTime: minutesToTime(clientStartMinutes),
            endTime: minutesToTime(clientEndMinutes),
          },
        });
        continue;
      }

      const finalSlot: ClientSlot = {
        startTime: minutesToTime(clientStartMinutes),
        endTime: minutesToTime(clientEndMinutes),
        travelBeforeMinutes: travelBefore,
        travelAfterMinutes: travelAfter,
        fromLabel:
          previousSlot?.formatted_address ||
          previousSlot?.city ||
          instructor.formatted_address ||
          'Domicile du moniteur',
        toLabel:
          nextSlot?.formatted_address ||
          nextSlot?.city ||
          instructor.formatted_address ||
          'Domicile du moniteur',
      };

      devLogger.log('[SLOT DEBUG] accepted', {
        date: dateIso,
        finalSlot,
      });

      clientSlotsForDay.push(finalSlot);
    }

    result[dateIso] = clientSlotsForDay;
    devLogger.log('[DAY] clientSlotsForDay', dateIso, clientSlotsForDay);

    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}

function applyClientAddressOverride(params: {
  client: InstructorAgendaUserRow;
  clientLatParam: string | null;
  clientLngParam: string | null;
  clientFormattedParam: string | null;
}): InstructorAgendaUserRow {
  const { client, clientLatParam, clientLngParam, clientFormattedParam } = params;

  if (!clientLatParam || !clientLngParam) {
    return client;
  }

  const lat = Number(clientLatParam);
  const lng = Number(clientLngParam);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return client;
  }

  return {
    ...client,
    lat,
    lng,
    formatted_address:
      clientFormattedParam && clientFormattedParam.trim().length > 0
        ? clientFormattedParam
        : client.formatted_address,
    is_primary: false,
  };
}

function toAgendaResponseUser(user: InstructorAgendaUserRow): AgendaResponseUser {
  return {
    id: user.id,
    name: user.name ?? null,
    role: user.role,
    formatted_address: user.formatted_address,
    lat: user.lat,
    lng: user.lng,
    street: user.street,
    street_number: user.street_number,
    postal_code: user.postal_code,
    city: user.city,
    country: user.country,
    country_code: user.country_code,
    google_place_id: user.google_place_id,
    raw_input: user.raw_input,
    address_label: user.address_label,
    is_primary: user.is_primary,
  };
}

async function resolveAgendaParticipants(params: {
  me: InstructorAgendaUserRow;
  targetClientUserId: string | null;
}): Promise<
  | {
      ok: true;
      instructor: InstructorAgendaUserRow;
      client: InstructorAgendaUserRow;
    }
  | { ok: false; status: number; body: { error: string } }
> {
  const { me, targetClientUserId } = params;

  if (!targetClientUserId) {
    if (me.role === 'instructor') {
      return { ok: true, instructor: me, client: me };
    }

    const foundInstructor = await getFirstAgencyInstructorForAgenda(me.agencyId);
    if (!foundInstructor) {
      return {
        ok: false,
        status: 404,
        body: { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
      };
    }

    return { ok: true, instructor: foundInstructor, client: me };
  }

  if (me.role !== 'instructor' && me.role !== 'admin') {
    return {
      ok: false,
      status: 403,
      body: { error: 'FORBIDDEN_CLIENT_BOOKING_DELEGATION' },
    };
  }

  const targetClient = await getAgendaUserById(targetClientUserId);
  if (!targetClient) {
    return { ok: false, status: 404, body: { error: 'CLIENT_NOT_FOUND' } };
  }

  if (targetClient.role !== 'student' || targetClient.agencyId !== me.agencyId) {
    return {
      ok: false,
      status: 403,
      body: { error: 'CLIENT_NOT_IN_AGENCY' },
    };
  }

  if (me.role === 'instructor') {
    return { ok: true, instructor: me, client: targetClient };
  }

  const foundInstructor = await getFirstAgencyInstructorForAgenda(me.agencyId);
  if (!foundInstructor) {
    return {
      ok: false,
      status: 404,
      body: { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
    };
  }

  return { ok: true, instructor: foundInstructor, client: targetClient };
}

export async function buildInstructorAgenda(params: {
  userId: string;
  startDate: string;
  endDate: string;
  clientLatParam: string | null;
  clientLngParam: string | null;
  clientFormattedParam: string | null;
  targetClientUserId?: string | null;
}): Promise<AgendaServiceResult> {
  const me = await getAgendaUserById(params.userId);
  if (!me) {
    return {
      ok: false,
      status: 404,
      body: { error: 'USER_NOT_FOUND' },
    };
  }

  const participants = await resolveAgendaParticipants({
    me,
    targetClientUserId: params.targetClientUserId ?? null,
  });
  if (!participants.ok) {
    return participants;
  }

  const clientForAgenda = applyClientAddressOverride({
    client: participants.client,
    clientLatParam: params.clientLatParam,
    clientLngParam: params.clientLngParam,
    clientFormattedParam: params.clientFormattedParam,
  });

  const [defaults, exceptions, bookedSlots] = await Promise.all([
    listInstructorDefaultAvailabilities(participants.instructor.id),
    listInstructorDayExceptions(
      participants.instructor.id,
      params.startDate,
      params.endDate,
    ),
    listInstructorBookedSlots(
      participants.instructor.id,
      params.startDate,
      params.endDate,
    ),
  ]);

  const clientSlotsByDate = await buildClientSlotsByDate({
    startDate: params.startDate,
    endDate: params.endDate,
    defaults,
    exceptions,
    bookedSlots,
    instructor: participants.instructor,
    client: clientForAgenda,
  });

  return {
    ok: true,
    payload: {
      weekStart: params.startDate,
      weekEnd: params.endDate,
      instructor: toAgendaResponseUser(participants.instructor),
      client: toAgendaResponseUser(clientForAgenda),
      defaults,
      exceptions,
      bookedSlots,
      clientSlotsByDate,
    },
  };
}
