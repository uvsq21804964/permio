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
  getTravelMetricsWithCache,
  type TravelPoint,
} from '@/lib/server/services/agenda-travel';
import { sortTimedSlots } from '@/lib/server/services/agenda-slot-utils';
import { devLogger } from '@/lib/shared/dev-logger';
import {
  getExactBookableSlotsForWindow,
  type ClientBookingSlot,
  type ExactBookableSlot,
  type SmartPricingClientPayload,
} from '@/lib/shared/bookable-slots';
import { getServicePricingByIdForUser } from '@/lib/server/repositories/service-repository';
import { getSmartPricingSettings } from '@/lib/server/pricing/getSmartPricingSettings';
import { computeSmartSlotPricing } from '@/lib/pricing/smartSlotPricing';

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
  clientSlotsByDate: Record<string, ClientBookingSlot[]>;
  exactClientSlotsByDate: Record<string, ExactBookableSlot[]>;
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

function combineDateAndTime(dateIso: string, time: string) {
  return `${dateIso}T${time.length === 5 ? `${time}:00` : time}`;
}

function centsFromServicePrice(price: string | number | null | undefined) {
  const numeric = Number(price);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return Math.max(0, Math.round(numeric * 100));
}

function toPricingSession(
  dateIso: string,
  slot: InstructorAgendaBookedSlot,
): {
  id: string;
  start: string;
  end: string;
  lat: number | null;
  lng: number | null;
  address?: string | null;
} {
  return {
    id: slot.id,
    start: combineDateAndTime(dateIso, slot.startTime),
    end: combineDateAndTime(dateIso, slot.endTime),
    lat: slot.lat,
    lng: slot.lng,
    address: slot.formatted_address ?? slot.city ?? null,
  };
}

function buildSmartPricingPayload(
  enabled: boolean,
  result: ReturnType<typeof computeSmartSlotPricing>,
): SmartPricingClientPayload {
  return {
    enabled,
    visibility: result.visibility,
    basePriceCents: result.basePriceCents,
    finalPriceCents: result.finalPriceCents,
    travelChargeCents: result.travelChargeCents,
    adjustmentCents: result.adjustmentCents,
    adjustmentPct: result.adjustmentPct,
    label: result.label,
    explanationKey: result.explanationKey,
  };
}

function computePrimeTimeScore(startTime: string) {
  const minutes = timeToMinutes(startTime);
  if (minutes >= 17 * 60 && minutes <= 20 * 60) {
    return 1;
  }

  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return 0.55;
  }

  if (minutes >= 9 * 60 && minutes < 12 * 60) {
    return 0.35;
  }

  return 0.2;
}

function computeDaysUntilSlot(dateIso: string, startTime: string) {
  const candidateDate = new Date(combineDateAndTime(dateIso, startTime));
  const diffMs = candidateDate.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}

function computeWeeklyFillRate(bookedSlots: InstructorAgendaBookedSlot[]) {
  const weeklyTargetSessions = 20;
  return Math.min(1, bookedSlots.length / weeklyTargetSessions);
}

const BOUNDARY_SLOT_DISCOUNT_CENTS = 100;

function getBoundaryDiscountedSlotIds(params: {
  candidateExactSlots: ExactBookableSlot[];
  previousSlot: InstructorAgendaBookedSlot | null;
  nextSlot: InstructorAgendaBookedSlot | null;
}) {
  const { candidateExactSlots, nextSlot, previousSlot } = params;
  if (!candidateExactSlots.length || (!previousSlot && !nextSlot)) {
    return new Set<string>();
  }

  const discountedSlotIds = new Set<string>();

  if (previousSlot) {
    discountedSlotIds.add(candidateExactSlots[0].id);
  }

  if (nextSlot) {
    discountedSlotIds.add(candidateExactSlots[candidateExactSlots.length - 1].id);
  }

  return discountedSlotIds;
}

async function buildClientSlotsByDate(params: {
  startDate: string;
  endDate: string;
  defaults: InstructorAgendaDefaultAvailability[];
  exceptions: InstructorAgendaDayException[];
  bookedSlots: InstructorAgendaBookedSlot[];
  instructor: InstructorAgendaUserRow;
  client: InstructorAgendaUserRow;
  isRemote: boolean;
  serviceDurationMinutes?: number | null;
  serviceBasePriceCents?: number | null;
  serviceIsRemote?: boolean;
  serviceIncludesTransport?: boolean;
  smartPricingEnabled: boolean;
  smartPricingParams?: Awaited<ReturnType<typeof getSmartPricingSettings>> | null;
}): Promise<{
  clientSlotsByDate: Record<string, ClientBookingSlot[]>;
  exactClientSlotsByDate: Record<string, ExactBookableSlot[]>;
}> {
  const {
    startDate,
    endDate,
    defaults,
    exceptions,
    bookedSlots,
    instructor,
    client,
    isRemote,
    serviceDurationMinutes,
    serviceBasePriceCents,
    serviceIsRemote,
    serviceIncludesTransport,
    smartPricingEnabled,
    smartPricingParams,
  } = params;

  const cache = createTravelDurationCache();
  const clientSlotsByDate: Record<string, ClientBookingSlot[]> = {};
  const exactClientSlotsByDate: Record<string, ExactBookableSlot[]> = {};
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

    const clientSlotsForDay: ClientBookingSlot[] = [];
    const exactClientSlotsForDay: ExactBookableSlot[] = [];
    const weeklyFillRate = computeWeeklyFillRate(bookedSlots);
    const daySessionsForPricing = bookedForDay.map((slot) =>
      toPricingSession(dateIso, slot),
    );

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

      const travelBeforeMetrics = isRemote
        ? { minutes: 0, km: 0 }
        : ((await getTravelMetricsWithCache(previousPoint, clientPoint, cache)) ?? {
            minutes: 0,
            km: 0,
          });
      const travelAfterMetrics = isRemote
        ? { minutes: 0, km: 0 }
        : ((await getTravelMetricsWithCache(clientPoint, nextPoint, cache)) ?? {
            minutes: 0,
            km: 0,
          });
      const previousToNextMetrics =
        isRemote || !previousSlot || !nextSlot
          ? null
          : await getTravelMetricsWithCache(previousPoint, nextPoint, cache);
      const homeToCandidateMetrics = isRemote
        ? { minutes: 0, km: 0 }
        : ((await getTravelMetricsWithCache(instructorPoint, clientPoint, cache)) ?? {
            minutes: 0,
            km: 0,
          });
      const homeToNextMetrics =
        isRemote || !nextSlot
          ? null
          : await getTravelMetricsWithCache(instructorPoint, nextPoint, cache);
      const candidateToHomeMetrics = isRemote
        ? { minutes: 0, km: 0 }
        : ((await getTravelMetricsWithCache(clientPoint, instructorPoint, cache)) ?? {
            minutes: 0,
            km: 0,
          });
      const previousLastSessionToHomeMetrics =
        isRemote || !previousSlot || nextSlot
          ? null
          : await getTravelMetricsWithCache(previousPoint, instructorPoint, cache);

      const travelBefore = travelBeforeMetrics.minutes ?? 0;
      const travelAfter = travelAfterMetrics.minutes ?? 0;

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

      const finalSlot: ClientBookingSlot = {
        startTime: minutesToTime(clientStartMinutes),
        endTime: minutesToTime(clientEndMinutes),
        travelBeforeMinutes: travelBefore,
        travelAfterMinutes: travelAfter,
        fromLabel: isRemote
          ? 'Remote'
          : previousSlot?.formatted_address ||
            previousSlot?.city ||
            instructor.formatted_address ||
            'Domicile du moniteur',
        toLabel: isRemote
          ? 'Remote'
          : nextSlot?.formatted_address ||
            nextSlot?.city ||
            instructor.formatted_address ||
            'Domicile du moniteur',
      };

      let visibleExactSlotsForWindow: ExactBookableSlot[] | null = null;

      if (
        serviceDurationMinutes != null &&
        serviceDurationMinutes > 0 &&
        serviceBasePriceCents != null &&
        smartPricingParams
      ) {
        const candidateExactSlots = getExactBookableSlotsForWindow({
          dateIso,
          rawSlot: finalSlot,
          serviceDuration: serviceDurationMinutes,
          earliestAllowed: new Date(0),
        });
        const boundaryDiscountedSlotIds = getBoundaryDiscountedSlotIds({
          candidateExactSlots,
          previousSlot,
          nextSlot,
        });

        visibleExactSlotsForWindow = candidateExactSlots.reduce<ExactBookableSlot[]>(
          (visibleSlots, slot) => {
            const pricingResult = computeSmartSlotPricing({
              basePriceCents: serviceBasePriceCents,
              serviceDurationMinutes,
              candidate: {
                start: combineDateAndTime(dateIso, slot.serviceStartTime),
                end: combineDateAndTime(dateIso, slot.serviceEndTime),
                lat: client.lat,
                lng: client.lng,
                address: client.formatted_address ?? client.city ?? null,
              },
              previousSession: previousSlot
                ? toPricingSession(dateIso, previousSlot)
                : null,
              nextSession: nextSlot ? toPricingSession(dateIso, nextSlot) : null,
              daySessions: daySessionsForPricing,
              trainerHome: {
                lat: instructor.lat,
                lng: instructor.lng,
                address: instructor.formatted_address ?? instructor.city ?? null,
              },
              travel: {
                previousToCandidateMinutes: travelBeforeMetrics.minutes,
                candidateToNextMinutes: travelAfterMetrics.minutes,
                previousToNextMinutes: previousToNextMetrics?.minutes ?? null,
                previousToCandidateKm: travelBeforeMetrics.km,
                candidateToNextKm: travelAfterMetrics.km,
                previousToNextKm: previousToNextMetrics?.km ?? null,
                homeToCandidateMinutes: homeToCandidateMetrics.minutes,
                candidateToHomeMinutes: candidateToHomeMetrics.minutes,
                homeToNextMinutes: homeToNextMetrics?.minutes ?? null,
                previousLastSessionToHomeMinutes:
                  previousLastSessionToHomeMetrics?.minutes ?? null,
                homeToCandidateKm: homeToCandidateMetrics.km,
                candidateToHomeKm: candidateToHomeMetrics.km,
                homeToNextKm: homeToNextMetrics?.km ?? null,
                previousLastSessionToHomeKm:
                  previousLastSessionToHomeMetrics?.km ?? null,
              },
              businessContext: {
                daysUntilSlot: computeDaysUntilSlot(dateIso, slot.serviceStartTime),
                weeklyFillRate,
                dailySessionCount: bookedForDay.length,
                dailyTargetSessions: 5,
                primeTimeScore: computePrimeTimeScore(slot.serviceStartTime),
                localDemandDensity: weeklyFillRate,
                probabilityOfBetterBooking:
                  weeklyFillRate > 0.8 ? 0.75 : weeklyFillRate > 0.5 ? 0.45 : 0.2,
                expectedBetterBookingMarginCents: Math.round(
                  serviceBasePriceCents * 0.18,
                ),
                isRecurringClientLikely: false,
                recurringClientExpectedValueCents: 0,
                boundarySlotDiscountCents:
                  boundaryDiscountedSlotIds.has(slot.id)
                    ? BOUNDARY_SLOT_DISCOUNT_CENTS
                    : 0,
              },
              riskContext: {
                latenessPenaltyCents: 1800,
                downstreamSessionsCount: nextSlot
                  ? bookedForDay.filter(
                      (bookedSlot) =>
                        timeToMinutes(bookedSlot.startTime) >=
                        timeToMinutes(slot.serviceEndTime),
                    ).length
                  : 0,
                overrunProbability: nextSlot ? 0.2 : 0,
                cancellationProbability: 0,
                replacementDifficulty: weeklyFillRate,
              },
              weatherContext: {
                enabled: false,
              },
              fatigueContext: {
                cumulativeDriveMinutesBeforeSlot: previousSlot ? travelBefore : 0,
                cumulativeSessionMinutesBeforeSlot: bookedForDay
                  .filter(
                    (bookedSlot) =>
                      timeToMinutes(bookedSlot.endTime) <=
                      timeToMinutes(slot.serviceStartTime),
                  )
                  .reduce(
                    (sum, bookedSlot) =>
                      sum +
                      (timeToMinutes(bookedSlot.endTime) -
                        timeToMinutes(bookedSlot.startTime)),
                    0,
                  ),
                consecutiveSessionsBeforeSlot: previousSlot ? 1 : 0,
                difficultSessionSequenceScore: 0,
              },
              serviceContext: {
                isRemote: serviceIsRemote ?? isRemote,
                includesTransport: serviceIncludesTransport ?? true,
              },
              params: smartPricingParams,
            });

            if (pricingResult.visibility !== 'visible') {
              return visibleSlots;
            }

            visibleSlots.push({
              ...slot,
              smartPricing: buildSmartPricingPayload(
                smartPricingEnabled,
                pricingResult,
              ),
            });

            return visibleSlots;
          },
          [],
        );

        exactClientSlotsForDay.push(...visibleExactSlotsForWindow);
      }

      if (visibleExactSlotsForWindow && visibleExactSlotsForWindow.length === 0) {
        continue;
      }

      devLogger.log('[SLOT DEBUG] accepted', {
        date: dateIso,
        finalSlot,
      });

      clientSlotsForDay.push(finalSlot);
    }

    clientSlotsByDate[dateIso] = clientSlotsForDay;
    exactClientSlotsByDate[dateIso] = exactClientSlotsForDay;
    devLogger.log('[DAY] clientSlotsForDay', dateIso, clientSlotsForDay);

    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    clientSlotsByDate,
    exactClientSlotsByDate,
  };
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
  isRemote: boolean;
  targetClientUserId?: string | null;
  serviceId?: number | null;
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

  const serviceDetails =
    params.serviceId != null
      ? await getServicePricingByIdForUser({
          serviceId: params.serviceId,
          userId: participants.instructor.id,
        })
      : null;
  const resolvedIsRemote = serviceDetails?.is_remote ?? params.isRemote;
  const smartPricingParams = await getSmartPricingSettings(
    participants.instructor.id,
  );

  const { clientSlotsByDate, exactClientSlotsByDate } =
    await buildClientSlotsByDate({
      startDate: params.startDate,
      endDate: params.endDate,
      defaults,
      exceptions,
      bookedSlots,
      instructor: participants.instructor,
      client: clientForAgenda,
      isRemote: resolvedIsRemote,
      serviceDurationMinutes: serviceDetails?.duration_minutes ?? null,
      serviceBasePriceCents: centsFromServicePrice(serviceDetails?.price),
      serviceIsRemote: serviceDetails?.is_remote ?? resolvedIsRemote,
      serviceIncludesTransport: serviceDetails?.includes_transport ?? true,
      smartPricingEnabled: smartPricingParams.enabled,
      smartPricingParams,
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
      exactClientSlotsByDate,
    },
  };
}
