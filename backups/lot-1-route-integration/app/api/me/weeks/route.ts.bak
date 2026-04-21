// app/api/agenda/last-week/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

type Role = 'student' | 'instructor' | 'admin';

type AnySlot = {
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"

  studentId?: string | null;
  studentName?: string | null;
  instructorName?: string | null;

  // Champs enrichis pour l'agenda + trajets
  serviceName?: string | null;
  servicePrice?: number | string | null;
  formattedAddress?: string | null;

  lat?: number | null;
  lng?: number | null;
};

type DbUserRow = {
  id: string;
  role: Role;
  name: string | null;
  agencyId: string;

  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
};

type TravelSlot = {
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  fromLabel: string | null;
  toLabel: string | null;
};

type TravelPoint = {
  lat: number | null;
  lng: number | null;
  formatted_address: string | null;
};

/** Fusionne les créneaux qui se touchent OU se chevauchent, par clé. */
function mergeIntervalsByKey<T extends AnySlot>(
  slots: T[],
  getKey: (s: T) => string
): T[] {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  const groups = new Map<string, T[]>();
  for (const s of slots) {
    const k = (getKey(s) ?? '').trim();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  const mergedAll: T[] = [];
  for (const [, arr] of groups) {
    const sorted = [...arr].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    let current: T | null = null;
    for (const s of sorted) {
      if (!current) {
        current = { ...s };
        continue;
      }

      if (s.startTime <= current.endTime) {
        // se touche / chevauche
        if (s.endTime > current.endTime) current.endTime = s.endTime;
        // ⚠️ On garde les méta-données du premier créneau du groupe.
      } else {
        mergedAll.push(current);
        current = { ...s };
      }
    }
    if (current) mergedAll.push(current);
  }

  return mergedAll.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Lundi de la semaine courante (Europe/Paris) en 'YYYY-MM-DD'. */
async function getThisMondayISO(): Promise<string> {
  const rows = await sql`
    WITH today AS (
      SELECT (NOW() AT TIME ZONE 'Europe/Paris')::date AS d
    ),
    monday_this AS (
      SELECT (d - (EXTRACT(ISODOW FROM d)::int - 1))::date AS m
      FROM today
    )
    SELECT m::text AS this_monday
    FROM monday_this
  `;
  return rows[0].this_monday as string;
}

// ---------- Helpers temps ----------

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  if (m < 0) m = 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function roundUpTo5(m: number): number {
  if (m <= 0) return 0;
  return Math.ceil(m / 5) * 5;
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
 * Appelle Distance Matrix pour récupérer la durée (en minutes, arrondi à 5)
 * entre deux points, avec un cache en mémoire pour la requête.
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

// ---------- Helpers diverses ----------

/** Détecte a minima qu'on a la bonne forme de payload. */
function looksLikeAgendaPayload(p: any): p is Partial<{
  weekShown: string;
  days: any[];
}> {
  return !!p && typeof p === 'object' && Array.isArray(p.days) && !!p.weekShown;
}

/**
 * Construit les travel slots pour les rôles ≠ student, à partir des slots fusionnés.
 *
 * Logique :
 *   - domicile ↔ premier cours
 *   - entre chaque cours (slot[i] → slot[i+1])
 *   - dernier cours → domicile
 * Les durées viennent de Google Distance Matrix, converties en blocs horaires.
 */
async function buildTravelSlotsForRole(params: {
  userRow: DbUserRow;
  role: Role;
  days: { dayOfWeek: number; dayDate?: string | null; slots: AnySlot[] }[];
}): Promise<Record<string, TravelSlot[]>> {
  const { userRow, role, days } = params;

  if (role === 'student') return {};

  const travelsByDate: Record<string, TravelSlot[]> = {};
  const cache = new Map<string, number | null>();

  const homePoint: TravelPoint = {
    lat: userRow.lat,
    lng: userRow.lng,
    formatted_address: userRow.formatted_address,
  };

  const homeLabel =
    userRow.formatted_address && userRow.formatted_address.trim().length > 0
      ? userRow.formatted_address
      : 'Domicile';

  const slotToPoint = (s: AnySlot): TravelPoint => ({
    lat: s.lat ?? null,
    lng: s.lng ?? null,
    formatted_address: s.formattedAddress ?? null,
  });

  const slotLabel = (s: AnySlot): string | null =>
    s.formattedAddress ?? s.studentName ?? s.instructorName ?? null;

  for (const d of days) {
    const date = d.dayDate ?? null;
    if (!date) continue;

    const slotsRaw = Array.isArray(d.slots) ? (d.slots as AnySlot[]) : [];
    if (!slotsRaw.length) continue;

    // Tri des slots du jour par heure
    const slots = [...slotsRaw].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    const travelsForDay: TravelSlot[] = [];

    // 1) Domicile → premier créneau
    const first = slots[0];
    {
      const duration =
        (await getTravelDurationMinutesWithCache(
          homePoint,
          slotToPoint(first),
          cache
        )) ?? null;

      if (duration && duration > 0) {
        const slotStartM = timeToMinutes(first.startTime);
        const travelStartM = Math.max(0, slotStartM - duration); // on ancre avant le cours
        travelsForDay.push({
          date,
          startTime: minutesToTime(travelStartM),
          endTime: minutesToTime(slotStartM),
          fromLabel: homeLabel,
          toLabel: slotLabel(first),
        });
      }
    }

    // 2) Entre chaque créneau successif
    for (let i = 0; i < slots.length - 1; i++) {
      const prev = slots[i];
      const next = slots[i + 1];

      const duration =
        (await getTravelDurationMinutesWithCache(
          slotToPoint(prev),
          slotToPoint(next),
          cache
        )) ?? null;

      if (!duration || duration <= 0) continue;

      const prevEndM = timeToMinutes(prev.endTime);
      const nextStartM = timeToMinutes(next.startTime);

      if (nextStartM <= prevEndM) {
        // cas bizarre / overlap : pas de trajet entre ces deux-là
        continue;
      }

      const travelStartM = prevEndM;
      const travelEndM = Math.min(prevEndM + duration, nextStartM);

      if (travelEndM <= travelStartM) continue;

      travelsForDay.push({
        date,
        startTime: minutesToTime(travelStartM),
        endTime: minutesToTime(travelEndM),
        fromLabel: slotLabel(prev),
        toLabel: slotLabel(next),
      });
    }

    // 3) Dernier créneau → domicile
    const last = slots[slots.length - 1];
    {
      const duration =
        (await getTravelDurationMinutesWithCache(
          slotToPoint(last),
          homePoint,
          cache
        )) ?? null;

      if (duration && duration > 0) {
        const lastEndM = timeToMinutes(last.endTime);
        const travelStartM = lastEndM;
        const travelEndM = lastEndM + duration;
        travelsForDay.push({
          date,
          startTime: minutesToTime(travelStartM),
          endTime: minutesToTime(travelEndM),
          fromLabel: slotLabel(last),
          toLabel: homeLabel,
        });
      }
    }

    if (travelsForDay.length) {
      travelsByDate[date] = travelsForDay;
    }
  }

  return travelsByDate;
}

// ---------- Handler principal ----------

export async function GET(req: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(req, {
      treatPendingAsSignedOut: false,
    });
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = req.nextUrl;
    const userIdParam = url.searchParams.get('userId');
    const weekStartParam = url.searchParams.get('weekStart');
    const targetUserId = userIdParam || authUserId;

    // User + position
    const userRows = await sql`
      SELECT
        u.id,
        u.role,
        u.name,
        u."agencyId",
        u.formatted_address,
        u.lat,
        u.lng
      FROM "User" u
      WHERE u.id = ${targetUserId}
      LIMIT 1
    `;
    if (!userRows.length) {
      return NextResponse.json(
        { error: `User ${targetUserId} not found` },
        { status: 404 }
      );
    }

    const userRow = userRows[0] as DbUserRow;
    const user: {
      id: string;
      role: Role;
      name: string | null;
      agencyId: string;
    } = {
      id: userRow.id,
      role: userRow.role,
      name: userRow.name,
      agencyId: userRow.agencyId,
    };

    // Semaine affichée : soit paramètre, soit lundi courant
    const weekShown =
      weekStartParam && weekStartParam.trim().length > 0
        ? weekStartParam
        : await getThisMondayISO();

    // === Construire les jours de la semaine ===
    const buildDaysForRole = async () => {
      if (user.role === 'student') {
        const rows = await sql`
      WITH params AS (
        SELECT ${weekShown}::date AS week_start
      ),
      days AS (
        SELECT
          generate_series(0, 6) AS "dayOfWeek",
          (week_start + generate_series(0, 6))::date AS "dayDate"
        FROM params
      ),
      slots AS (
        SELECT
          (s."date" - p.week_start)        AS "dayOfWeek",
          s."date"::text                   AS "dayDate",
          s."startTime"                    AS "startTime",
          s."endTime"                      AS "endTime",
          instr."name"                     AS "instructorName",
          sp."name"                        AS "serviceName",
          sp."price"                       AS "servicePrice",
          s."formatted_address"            AS "formattedAddress",
          s."lat"                          AS "lat",
          s."lng"                          AS "lng"
        FROM "Slot" s
        JOIN "User" instr
          ON instr."id" = s."dogsitterUserId"
        JOIN params p ON TRUE
        LEFT JOIN "services_pricing" sp
          ON sp."id" = s."serviceId"
        WHERE s."clientUserId" = ${targetUserId}
          AND s."date" >= p.week_start
          AND s."date" <  (p.week_start + INTERVAL '7 days')
      )
      SELECT
        d."dayOfWeek",
        d."dayDate"::text AS "dayDate",
        COALESCE(
          json_agg(
            json_build_object(
              'startTime',        s."startTime",
              'endTime',          s."endTime",
              'instructorName',   s."instructorName",
              'serviceName',      s."serviceName",
              'servicePrice',     s."servicePrice",
              'formattedAddress', s."formattedAddress",
              'lat',              s."lat",
              'lng',              s."lng"
            )
            ORDER BY s."startTime"
          ) FILTER (WHERE s."startTime" IS NOT NULL),
          '[]'::json
        ) AS slots
      FROM days d
      LEFT JOIN slots s
        ON s."dayOfWeek" = d."dayOfWeek"
      GROUP BY d."dayOfWeek", d."dayDate"
      ORDER BY d."dayOfWeek"
    `;

        return rows.map((r: any) => {
          const rawSlots = (r.slots ?? []) as AnySlot[];

          const mergedSlots = mergeIntervalsByKey(rawSlots, (s) =>
            (s.instructorName ?? '').trim()
          );

          return {
            dayOfWeek: Number(r.dayOfWeek),
            dayDate: r.dayDate as string,
            slots: mergedSlots,
          };
        });
      }

      if (user.role === 'instructor') {
        const rows = await sql`
      WITH params AS (
        SELECT ${weekShown}::date AS week_start
      ),
      days AS (
        SELECT
          generate_series(0, 6) AS "dayOfWeek",
          (week_start + generate_series(0, 6))::date AS "dayDate"
        FROM params
      ),
      slots AS (
        SELECT
          (s."date" - p.week_start)        AS "dayOfWeek",
          s."date"::text                   AS "dayDate",
          s."startTime"                    AS "startTime",
          s."endTime"                      AS "endTime",
          cli."id"                         AS "studentId",
          cli."name"                       AS "studentName",
          sp."name"                        AS "serviceName",
          sp."price"                       AS "servicePrice",
          s."formatted_address"            AS "formattedAddress",
          s."lat"                          AS "lat",
          s."lng"                          AS "lng"
        FROM "Slot" s
        JOIN "User" cli
          ON cli."id" = s."clientUserId"
        JOIN params p ON TRUE
        LEFT JOIN "services_pricing" sp
          ON sp."id" = s."serviceId"
        WHERE s."dogsitterUserId" = ${targetUserId}
          AND s."date" >= p.week_start
          AND s."date" <  (p.week_start + INTERVAL '7 days')
      )
      SELECT
        d."dayOfWeek",
        d."dayDate"::text AS "dayDate",
        COALESCE(
          json_agg(
            json_build_object(
              'startTime',        s."startTime",
              'endTime',          s."endTime",
              'studentId',        s."studentId",
              'studentName',      s."studentName",
              'serviceName',      s."serviceName",
              'servicePrice',     s."servicePrice",
              'formattedAddress', s."formattedAddress",
              'lat',              s."lat",
              'lng',              s."lng"
            )
            ORDER BY s."startTime"
          ) FILTER (WHERE s."startTime" IS NOT NULL),
          '[]'::json
        ) AS slots
      FROM days d
      LEFT JOIN slots s
        ON s."dayOfWeek" = d."dayOfWeek"
      GROUP BY d."dayOfWeek", d."dayDate"
      ORDER BY d."dayOfWeek"
    `;

        const map = new Map<
          number,
          { dayDate: string | null; slots: AnySlot[] }
        >();

        rows.forEach((r: any) =>
          map.set(Number(r.dayOfWeek), {
            dayDate: r.dayDate as string,
            slots: Array.isArray(r.slots) ? (r.slots as AnySlot[]) : [],
          })
        );

        return Array.from({ length: 7 }, (_, d) => {
          const hit = map.get(d);
          const rawSlots = (hit?.slots ?? []) as AnySlot[];

          const mergedSlots = mergeIntervalsByKey(rawSlots, (s) =>
            (s.studentId ?? s.studentName ?? '').trim()
          );

          return {
            dayOfWeek: d,
            dayDate: hit?.dayDate ?? null,
            slots: mergedSlots,
          };
        });
      }

      // Admin ou autre rôle → pas de slots, donc pas de trajets non plus
      return Array.from({ length: 7 }, (_, d) => ({
        dayOfWeek: d,
        dayDate: null,
        slots: [] as AnySlot[],
      }));
    };

    // === 4 prochains cours réservés pour l'ÉLÈVE, sur 5 semaines max ===
    const buildNextSlots = async () => {
      if (user.role !== 'student') {
        return [];
      }

      const rows = await sql`
        WITH now_paris AS (
          SELECT
            (NOW() AT TIME ZONE 'Europe/Paris')::date AS d,
            (NOW() AT TIME ZONE 'Europe/Paris')::time AS t,
            ((NOW() AT TIME ZONE 'Europe/Paris')::date + INTERVAL '5 weeks')::date AS d_max
        )
        SELECT
          s."date"::text          AS "date",
          s."startTime"           AS "startTime",
          s."endTime"             AS "endTime",
          instr."name"            AS "counterpartName"
        FROM "Slot" s
        JOIN "User" instr
          ON instr."id" = s."dogsitterUserId"
        JOIN now_paris np ON TRUE
        WHERE s."clientUserId" = ${targetUserId}
          AND (
            s."date" > np.d
            OR (s."date" = np.d AND s."startTime"::time >= np.t)
          )
          AND s."date" <= np.d_max
        ORDER BY s."date", s."startTime"::time
        LIMIT 4
      `;

      return rows.map((r: any) => ({
        date: r.date as string,
        startTime: r.startTime as string,
        endTime: r.endTime as string,
        counterpartName: (r.counterpartName as string) ?? null,
      }));
    };

    const [days, nextSlots] = await Promise.all([
      buildDaysForRole(),
      buildNextSlots(),
    ]);

    // 🔶 Calcul des travel slots (trajets réels via Google Maps) pour les rôles ≠ student
    const travelsByDate = await buildTravelSlotsForRole({
      userRow,
      role: user.role,
      days: days as any,
    });

    return NextResponse.json({
      weekShown,
      user: { id: user.id, name: user.name, role: user.role },
      days,
      hasDetailedSlots: true,
      nextSlots,
      travelsByDate,
    });
  } catch (err: any) {
    console.error('[GET /api/agenda/last-week] error', err);
    return NextResponse.json(
      { error: 'Failed to load agenda', detail: err?.message },
      { status: 500 }
    );
  }
}
