// app/api/me/instructor-weekly-agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';
import { timeToMinutes } from '@/lib/api/time';

type Kind = 'available' | 'unavailable';

type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi ... 6 = Dimanche
  startTime: string;
  endTime: string;
};

type DayException = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  kind: Kind;
};

// Créneaux réservés du moniteur, avec adresse du slot (lieu de la prestation)
type BookedSlot = {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  clientUserId: string;

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
};

type DbUserRow = {
  id: string;
  name: string | null;
  role: string;
  agencyId: string;

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

type Interval = { start: number; end: number };

type TimeRange = { startTime: string; endTime: string };

type ClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string; // adresse / label de départ
  toLabel: string; // adresse / label d’arrivée
};

type TravelPoint = {
  lat: number | null;
  lng: number | null;
  formatted_address: string | null;
};

// ---------- Helpers date / temps ----------

function isoToDateOnly(iso: string): Date {
  const base = iso.slice(0, 10);
  const [yStr, mStr, dStr] = base.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfWeekMondayISO(base?: string): string {
  const d = base ? isoToDateOnly(base) : new Date();
  const dow = d.getDay(); // 0..6 (0=dim)
  const isoDow = dow === 0 ? 7 : dow;
  const diff = isoDow - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return dateToISO(d);
}

function addDaysISO(iso: string, delta: number): string {
  const d = isoToDateOnly(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

function roundUpTo5(m: number): number {
  if (m <= 0) return 0;
  return Math.ceil(m / 5) * 5;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ---------- Helpers intervalles ----------

function mergeIntervals(ranges: Interval[]): Interval[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const result: Interval[] = [];
  let current = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i++) {
    const r = sorted[i];
    if (r.start <= current.end) {
      current.end = Math.max(current.end, r.end);
    } else {
      result.push(current);
      current = { ...r };
    }
  }
  result.push(current);
  return result;
}

function subtractIntervals(base: Interval[], blocks: Interval[]): Interval[] {
  let res = [...base];
  for (const b of blocks) {
    const tmp: Interval[] = [];
    for (const r of res) {
      if (b.end <= r.start || b.start >= r.end) {
        tmp.push(r);
        continue;
      }
      if (b.start > r.start) {
        tmp.push({ start: r.start, end: b.start });
      }
      if (b.end < r.end) {
        tmp.push({ start: b.end, end: r.end });
      }
    }
    res = tmp;
  }
  return res;
}

/**
 * Calcule les créneaux disponibles finaux pour un jour :
 * - defaults (semaine type)
 * - + exceptions kind='available'
 * - - exceptions kind='unavailable'
 */
function buildAvailableSlotsForDay(
  defaultsForDay: DefaultAvailability[],
  exceptionsForDay: DayException[]
): TimeRange[] {
  const defaultIntervals: Interval[] = defaultsForDay.map((a) => ({
    start: timeToMinutes(a.startTime),
    end: timeToMinutes(a.endTime),
  }));

  const extraAvail: Interval[] = exceptionsForDay
    .filter((e) => e.kind === 'available')
    .map((e) => ({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    }));

  const unavail: Interval[] = exceptionsForDay
    .filter((e) => e.kind === 'unavailable')
    .map((e) => ({
      start: timeToMinutes(e.startTime),
      end: timeToMinutes(e.endTime),
    }));

  const base = mergeIntervals([...defaultIntervals, ...extraAvail]);
  const withoutUnavail = subtractIntervals(base, unavail);
  const finalMerged = mergeIntervals(withoutUnavail);

  return finalMerged.map((r) => ({
    startTime: minutesToTime(r.start),
    endTime: minutesToTime(r.end),
  }));
}

function subtractBookedSlots(
  slots: TimeRange[],
  booked: BookedSlot[]
): TimeRange[] {
  if (!booked.length) return slots;

  const baseIntervals: Interval[] = slots.map((s) => ({
    start: timeToMinutes(s.startTime),
    end: timeToMinutes(s.endTime),
  }));

  const bookedIntervals: Interval[] = booked.map((b) => ({
    start: timeToMinutes(b.startTime),
    end: timeToMinutes(b.endTime),
  }));

  const mergedBooked = mergeIntervals(bookedIntervals);
  const remaining = subtractIntervals(baseIntervals, mergedBooked);

  return remaining.map((r) => ({
    startTime: minutesToTime(r.start),
    endTime: minutesToTime(r.end),
  }));
}

// ---------- Helpers Google Maps ----------

function buildLatLngString(point: TravelPoint): string | null {
  if (point.lat == null || point.lng == null) return null;
  return `${point.lat},${point.lng}`;
}

function pointKey(p: TravelPoint): string {
  if (p.lat != null && p.lng != null) return `${p.lat},${p.lng}`;
  if (p.formatted_address) return p.formatted_address;
  return 'unknown';
}

/**
 * Appelle l'API Distance Matrix de Google pour récupérer la durée de trajet (en minutes)
 * entre deux points (origin, destination). On utilise d'abord lat/lng, sinon une adresse.
 * Utilise un petit cache en mémoire pour éviter les appels en double.
 */
async function getTravelDurationMinutesWithCache(
  origin: TravelPoint,
  destination: TravelPoint,
  cache: Map<string, number | null>
): Promise<number | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const originParam = buildLatLngString(origin) ?? origin.formatted_address;
  const destinationParam =
    buildLatLngString(destination) ?? destination.formatted_address;

  if (!apiKey || !originParam || !destinationParam) {
    console.log('[DISTANCE] paramètres manquants', {
      apiKeyPresent: !!apiKey,
      originParam,
      destinationParam,
    });
    return null;
  }

  const key = `${pointKey(origin)}|${pointKey(destination)}`;
  if (cache.has(key)) {
    const cached = cache.get(key) ?? null;
    console.log('[DISTANCE] cache hit', { key, minutes: cached });
    return cached;
  }

  const url = new URL(
    'https://maps.googleapis.com/maps/api/distancematrix/json'
  );
  url.searchParams.set('key', apiKey);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('origins', originParam);
  url.searchParams.set('destinations', destinationParam);

  try {
    console.log('[DISTANCE] call', {
      origin: originParam,
      destination: destinationParam,
    });

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('[DISTANCE] HTTP error', res.status, text.slice(0, 300));
      cache.set(key, null);
      return null;
    }

    const data: any = await res.json();

    if (data.status !== 'OK') {
      console.error('[DISTANCE] API status error', {
        status: data.status,
        error_message: data.error_message,
      });
      cache.set(key, null);
      return null;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (element?.status !== 'OK' || !element.duration?.value) {
      console.error('[DISTANCE] element status error', {
        elementStatus: element?.status,
      });
      cache.set(key, null);
      return null;
    }

    const seconds: number = element.duration.value;
    const minutesRaw = Math.round(seconds / 60);
    const minutes = roundUpTo5(minutesRaw);

    console.log('[DISTANCE] success', {
      origin: originParam,
      destination: destinationParam,
      seconds,
      minutesRaw,
      minutesRoundedTo5: minutes,
    });

    cache.set(key, minutes);
    return minutes;
  } catch (err) {
    console.error('[DISTANCE] fetch error', err);
    cache.set(key, null);
    return null;
  }
}

// ---------- Construction des créneaux client par jour ----------

async function buildClientSlotsForWeek(params: {
  weekStart: string;
  defaults: DefaultAvailability[];
  exceptions: DayException[];
  bookedSlots: BookedSlot[];
  instructor: DbUserRow;
  client: DbUserRow;
}): Promise<Record<string, TimeRange[]>> {
  const { weekStart, defaults, exceptions, bookedSlots, instructor, client } =
    params;

  const cache = new Map<string, number | null>();
  const result: Record<string, TimeRange[]> = {};

  const instructorPoint: TravelPoint = {
    lat: instructor.lat,
    lng: instructor.lng,
    formatted_address: instructor.formatted_address,
  };

  const clientPoint: TravelPoint = {
    lat: client.lat,
    lng: client.lng,
    formatted_address: client.formatted_address,
  };

  const weekDates: string[] = Array.from({ length: 7 }, (_, i) =>
    addDaysISO(weekStart, i)
  );

  for (let dayIndex = 0; dayIndex < weekDates.length; dayIndex++) {
    const dateIso = weekDates[dayIndex];

    // 1) Dispos de base (semaine type + exceptions)
    const defaultsForDay =
      defaults.filter((a) => a.dayOfWeek === dayIndex) ?? [];
    const exceptionsForDay = exceptions.filter((e) => e.date === dateIso) ?? [];

    const baseAvailableSlots = buildAvailableSlotsForDay(
      defaultsForDay,
      exceptionsForDay
    );

    // 2) Slots déjà réservés pour ce jour (avec adresses)
    const bookedForDay = bookedSlots
      .filter((b) => b.date === dateIso)
      .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    // 3) Intervalles libres (dispos - réservations)
    const freeSlots = subtractBookedSlots(baseAvailableSlots, bookedForDay);

    console.log('--- [DAY]', dateIso, '---');
    console.log('[DAY] baseAvailableSlots', baseAvailableSlots);
    console.log(
      '[DAY] bookedForDay',
      bookedForDay.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        formatted_address: s.formatted_address,
      }))
    );
    console.log('[DAY] freeSlots', freeSlots);

    const clientSlotsForDay: TimeRange[] = [];

    for (const free of freeSlots) {
      const freeStartM = timeToMinutes(free.startTime);
      const freeEndM = timeToMinutes(free.endTime);
      if (freeEndM <= freeStartM) continue;

      // Slot précédent (pour debug)
      let prevPoint: TravelPoint = instructorPoint;
      let prevSlot: BookedSlot | null = null;

      for (const s of bookedForDay) {
        const sEnd = timeToMinutes(s.endTime);
        if (sEnd <= freeStartM) {
          prevPoint = {
            lat: s.lat,
            lng: s.lng,
            formatted_address: s.formatted_address,
          };
          prevSlot = s;
        } else {
          break;
        }
      }

      // Slot suivant (pour debug)
      let nextPoint: TravelPoint = instructorPoint;
      let nextSlot: BookedSlot | null = null;

      for (const s of bookedForDay) {
        const sStart = timeToMinutes(s.startTime);
        if (sStart >= freeEndM) {
          nextPoint = {
            lat: s.lat,
            lng: s.lng,
            formatted_address: s.formatted_address,
          };
          nextSlot = s;
          break;
        }
      }

      // Durée de trajet avant : prev -> client
      const travelBefore =
        (await getTravelDurationMinutesWithCache(
          prevPoint,
          clientPoint,
          cache
        )) ?? 0;

      // Durée de trajet après : client -> next
      const travelAfter =
        (await getTravelDurationMinutesWithCache(
          clientPoint,
          nextPoint,
          cache
        )) ?? 0;

      const totalTravel = travelBefore + travelAfter;

      const clientStartM = freeStartM + travelBefore;
      const clientEndM = freeEndM - travelAfter;

      console.log('[SLOT DEBUG]', {
        date: dateIso,
        freeSlot: {
          startTime: free.startTime,
          endTime: free.endTime,
        },
        prevSlot: prevSlot
          ? {
              id: prevSlot.id,
              startTime: prevSlot.startTime,
              endTime: prevSlot.endTime,
              formatted_address: prevSlot.formatted_address,
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
          startMinutes: clientStartM,
          endMinutes: clientEndM,
        },
        clientWindowTime: {
          startTime: minutesToTime(clientStartM),
          endTime: minutesToTime(clientEndM),
        },
      });

      if (freeEndM - freeStartM <= totalTravel) {
        // Pas assez de place pour aller chez le client + repartir
        console.log('[SLOT DEBUG] rejeté (pas assez de place pour le trajet)', {
          date: dateIso,
          freeSlot: {
            startTime: free.startTime,
            endTime: free.endTime,
          },
          totalTravelMinutes: totalTravel,
          freeDurationMinutes: freeEndM - freeStartM,
        });
        continue;
      }

      if (clientEndM <= clientStartM) {
        console.log('[SLOT DEBUG] rejeté (fenêtre client inversée ou vide)', {
          date: dateIso,
          clientWindowTime: {
            startTime: minutesToTime(clientStartM),
            endTime: minutesToTime(clientEndM),
          },
        });
        continue;
      }

      // Label de départ = slot précédent ou domicile moniteur
      const fromLabel =
        prevSlot?.formatted_address ||
        prevSlot?.city ||
        instructor.formatted_address ||
        'Domicile du moniteur';

      // Label d’arrivée = slot suivant ou domicile moniteur
      const toLabel =
        nextSlot?.formatted_address ||
        nextSlot?.city ||
        instructor.formatted_address ||
        'Domicile du moniteur';

      const finalSlot: ClientSlot = {
        startTime: minutesToTime(clientStartM),
        endTime: minutesToTime(clientEndM),
        travelBeforeMinutes: travelBefore,
        travelAfterMinutes: travelAfter,
        fromLabel,
        toLabel,
      };

      console.log('[SLOT DEBUG] accepté', {
        date: dateIso,
        finalSlot,
      });

      clientSlotsForDay.push(finalSlot);
    }

    result[dateIso] = clientSlotsForDay;
    console.log('[DAY] clientSlotsForDay', dateIso, clientSlotsForDay);
  }

  return result;
}

// ---------- Handler principal ----------

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const weekStartParam = url.searchParams.get('weekStart');
    const weekStart = startOfWeekMondayISO(weekStartParam || undefined);
    const weekEnd = addDaysISO(weekStart, 6);

    // 🔹 Nouveau : lecture des éventuels overrides d’adresse pour ce rendez-vous
    const clientLatParam = url.searchParams.get('clientLat');
    const clientLngParam = url.searchParams.get('clientLng');
    const clientFormattedParam = url.searchParams.get('clientFormatted');

    // 1) Récupérer l'utilisateur courant (client potentiel) + adresse
    const [me] = (await sql/* sql */ `
      SELECT
        id,
        name,
        role,
        "agencyId",
        formatted_address,
        lat,
        lng,
        street,
        street_number,
        postal_code,
        city,
        country,
        country_code,
        google_place_id,
        raw_input,
        address_label,
        is_primary
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `) as DbUserRow[];

    if (!me) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // 🔹 Nouveau : construire le "client" utilisé pour cette semaine
    // On part de "me" et on écrase lat/lng/+adresse si l’URL fournit une adresse de rendez-vous
    let clientForWeek: DbUserRow = me;

    if (clientLatParam && clientLngParam) {
      const lat = Number(clientLatParam);
      const lng = Number(clientLngParam);

      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        clientForWeek = {
          ...me,
          lat,
          lng,
          formatted_address:
            clientFormattedParam && clientFormattedParam.trim().length > 0
              ? clientFormattedParam
              : me.formatted_address,
          // pour une adresse ponctuelle, on peut considérer qu’elle n’est pas "primary"
          is_primary: false,
        };
      }
    }

    // 2) Trouver le moniteur de la même agence (dogsitter) + adresse
    let instructor: DbUserRow = me;

    if (me.role !== 'instructor') {
      const [foundInstructor] = (await sql/* sql */ `
        SELECT
          id,
          name,
          role,
          "agencyId",
          formatted_address,
          lat,
          lng,
          street,
          street_number,
          postal_code,
          city,
          country,
          country_code,
          google_place_id,
          raw_input,
          address_label,
          is_primary
        FROM "User"
        WHERE "agencyId" = ${me.agencyId}
          AND role = 'instructor'
        LIMIT 1
      `) as DbUserRow[];

      if (!foundInstructor) {
        return NextResponse.json(
          { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
          { status: 404 }
        );
      }

      instructor = foundInstructor;
    }

    const instructorId = instructor.id;

    // 3) Semaine type du moniteur
    const defaults = (await sql/* sql */ `
      SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
      FROM "Availability"
      WHERE "userId" = ${instructorId}
      ORDER BY "dayOfWeek", "startTime"
    `) as DefaultAvailability[];

    // 4) Exceptions ponctuelles du moniteur sur cette semaine
    const exceptions = (await sql/* sql */ `
      SELECT
        id,
        "userId",
        "date"::date::text AS "date",
        "startTime",
        "endTime",
        kind
      FROM "DayAvailability"
      WHERE "userId" = ${instructorId}
        AND "date" >= ${weekStart}::date
        AND "date" <= ${weekEnd}::date
      ORDER BY "date", "startTime"
    `) as DayException[];

    // 5) Créneaux déjà réservés pour ce moniteur sur cette semaine
    const bookedSlots = (await sql/* sql */ `
      SELECT
        id,
        "date"::date::text AS "date",
        "startTime",
        "endTime",
        "clientUserId",
        formatted_address,
        lat,
        lng,
        street,
        street_number,
        postal_code,
        city,
        country,
        country_code,
        google_place_id,
        raw_input,
        address_label
      FROM "Slot"
      WHERE "dogsitterUserId" = ${instructorId}
        AND "date" BETWEEN ${weekStart}::date AND ${weekEnd}::date
      ORDER BY "date", "startTime"
    `) as BookedSlot[];

    // 6) Construire, par jour, les créneaux possibles pour CE client
    //    👉 On utilise maintenant "clientForWeek" (adresse potentiellement surchargée)
    const clientSlotsByDate = await buildClientSlotsForWeek({
      weekStart,
      defaults,
      exceptions,
      bookedSlots,
      instructor,
      client: clientForWeek,
    });

    return NextResponse.json(
      {
        weekStart,
        weekEnd,

        instructor: {
          id: instructor.id,
          name: instructor.name ?? null,
          role: instructor.role,
          formatted_address: instructor.formatted_address,
          lat: instructor.lat,
          lng: instructor.lng,
          street: instructor.street,
          street_number: instructor.street_number,
          postal_code: instructor.postal_code,
          city: instructor.city,
          country: instructor.country,
          country_code: instructor.country_code,
          google_place_id: instructor.google_place_id,
          raw_input: instructor.raw_input,
          address_label: instructor.address_label,
          is_primary: instructor.is_primary,
        },

        // 🔹 Nouveau : on renvoie aussi le "client" avec l’adresse réellement utilisée
        client: {
          id: clientForWeek.id,
          name: clientForWeek.name ?? null,
          role: clientForWeek.role,
          formatted_address: clientForWeek.formatted_address,
          lat: clientForWeek.lat,
          lng: clientForWeek.lng,
          street: clientForWeek.street,
          street_number: clientForWeek.street_number,
          postal_code: clientForWeek.postal_code,
          city: clientForWeek.city,
          country: clientForWeek.country,
          country_code: clientForWeek.country_code,
          google_place_id: clientForWeek.google_place_id,
          raw_input: clientForWeek.raw_input,
          address_label: clientForWeek.address_label,
          is_primary: clientForWeek.is_primary,
        },

        defaults,
        exceptions,
        bookedSlots,

        // Créneaux déjà ajustés pour ce client et CETTE adresse
        clientSlotsByDate,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[GET /api/me/instructor-weekly-agenda] error:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch instructor weekly agenda',
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}
