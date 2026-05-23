import { sql } from '@/lib/db';
import { addDaysISO, dateToISO, isoToDateOnly } from '@/lib/server/services/agenda-date';
import {
  minutesToTime,
  timeToMinutes,
} from '@/lib/server/domain/time-ranges';
import { ensureSlotPricingSchema } from '@/lib/server/repositories/slot-repository';
import {
  sortTimedSlots,
} from '@/lib/server/services/agenda-slot-utils';
import {
  createTravelDurationCache,
  getTravelDurationMinutesWithCache,
  type TravelPoint,
} from '@/lib/server/services/agenda-travel';

type Role = 'student' | 'instructor' | 'admin';

type WeekSlot = {
  id: number;
  startTime: string;
  endTime: string;
  studentId?: string | null;
  studentName?: string | null;
  instructorName?: string | null;
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

type WeekUser = {
  id: string;
  role: Role;
  name: string | null;
  agencyId: string;
};

type TravelSlot = {
  date: string;
  startTime: string;
  endTime: string;
  fromLabel: string | null;
  toLabel: string | null;
};

type WeekDay = {
  dayOfWeek: number;
  dayDate: string | null;
  slots: WeekSlot[];
};

type NextSlot = {
  date: string;
  startTime: string;
  endTime: string;
  counterpartName: string | null;
};

export type MyWeeksPayload = {
  weekShown: string;
  user: {
    id: string;
    name: string | null;
    role: Role;
  };
  days: WeekDay[];
  hasDetailedSlots: true;
  nextSlots: NextSlot[];
  travelsByDate: Record<string, TravelSlot[]>;
};

type MyWeeksResult =
  | { ok: true; payload: MyWeeksPayload }
  | { ok: false; status: number; body: { error: string } };

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

async function getWeekUserById(userId: string): Promise<DbUserRow | null> {
  const rows = await sql`
    SELECT
      u.id,
      u.role,
      u.name,
      u."agencyId",
      u.formatted_address,
      u.lat,
      u.lng
    FROM "User" u
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  return (rows[0] as DbUserRow | undefined) ?? null;
}

function toWeekUser(row: DbUserRow): WeekUser {
  return {
    id: row.id,
    role: row.role,
    name: row.name,
    agencyId: row.agencyId,
  };
}

async function listStudentWeekDays(
  userId: string,
  weekShown: string,
): Promise<WeekDay[]> {
  await ensureSlotPricingSchema();

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
        (s."date" - p.week_start) AS "dayOfWeek",
        s."date"::text AS "dayDate",
        s.id AS "id",
        s."startTime" AS "startTime",
        s."endTime" AS "endTime",
        instr."name" AS "instructorName",
        sp."name" AS "serviceName",
        COALESCE(
          s.effective_price_cents::numeric / 100.0,
          NULLIF(s.smart_pricing_snapshot ->> 'final_price_cents', '')::numeric / 100.0,
          sp."price"
        ) AS "servicePrice",
        s."formatted_address" AS "formattedAddress",
        s."lat" AS "lat",
        s."lng" AS "lng"
      FROM "Slot" s
      JOIN "User" instr
        ON instr."id" = s."dogsitterUserId"
      JOIN params p ON TRUE
      LEFT JOIN "services_pricing" sp
        ON sp."id" = s."serviceId"
      WHERE s."clientUserId" = ${userId}
        AND s."date" >= p.week_start
        AND s."date" < (p.week_start + INTERVAL '7 days')
    )
    SELECT
      d."dayOfWeek",
      d."dayDate"::text AS "dayDate",
      COALESCE(
        json_agg(
          json_build_object(
            'id', s."id",
            'startTime', s."startTime",
            'endTime', s."endTime",
            'instructorName', s."instructorName",
            'serviceName', s."serviceName",
            'servicePrice', s."servicePrice",
            'formattedAddress', s."formattedAddress",
            'lat', s."lat",
            'lng', s."lng"
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

  return rows.map((row: any) => {
    const rawSlots = Array.isArray(row.slots) ? (row.slots as WeekSlot[]) : [];

    return {
      dayOfWeek: Number(row.dayOfWeek),
      dayDate: row.dayDate as string,
      slots: sortTimedSlots(rawSlots),
    };
  });
}

async function listInstructorWeekDays(
  userId: string,
  weekShown: string,
): Promise<WeekDay[]> {
  await ensureSlotPricingSchema();

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
        (s."date" - p.week_start) AS "dayOfWeek",
        s."date"::text AS "dayDate",
        s.id AS "id",
        s."startTime" AS "startTime",
        s."endTime" AS "endTime",
        cli."id" AS "studentId",
        cli."name" AS "studentName",
        sp."name" AS "serviceName",
        COALESCE(
          s.effective_price_cents::numeric / 100.0,
          NULLIF(s.smart_pricing_snapshot ->> 'final_price_cents', '')::numeric / 100.0,
          sp."price"
        ) AS "servicePrice",
        s."formatted_address" AS "formattedAddress",
        s."lat" AS "lat",
        s."lng" AS "lng"
      FROM "Slot" s
      JOIN "User" cli
        ON cli."id" = s."clientUserId"
      JOIN params p ON TRUE
      LEFT JOIN "services_pricing" sp
        ON sp."id" = s."serviceId"
      WHERE s."dogsitterUserId" = ${userId}
        AND s."date" >= p.week_start
        AND s."date" < (p.week_start + INTERVAL '7 days')
    )
    SELECT
      d."dayOfWeek",
      d."dayDate"::text AS "dayDate",
      COALESCE(
        json_agg(
          json_build_object(
            'id', s."id",
            'startTime', s."startTime",
            'endTime', s."endTime",
            'studentId', s."studentId",
            'studentName', s."studentName",
            'serviceName', s."serviceName",
            'servicePrice', s."servicePrice",
            'formattedAddress', s."formattedAddress",
            'lat', s."lat",
            'lng', s."lng"
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

  const byDay = new Map<number, { dayDate: string | null; slots: WeekSlot[] }>();
  rows.forEach((row: any) => {
    byDay.set(Number(row.dayOfWeek), {
      dayDate: row.dayDate as string,
      slots: Array.isArray(row.slots) ? (row.slots as WeekSlot[]) : [],
    });
  });

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const hit = byDay.get(dayOfWeek);
    const rawSlots = hit?.slots ?? [];

    return {
      dayOfWeek,
      dayDate: hit?.dayDate ?? null,
      slots: sortTimedSlots(rawSlots),
    };
  });
}

function buildEmptyWeekDays(): WeekDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    dayDate: null,
    slots: [],
  }));
}

async function buildDaysForRole(
  user: WeekUser,
  weekShown: string,
): Promise<WeekDay[]> {
  if (user.role === 'student') {
    return listStudentWeekDays(user.id, weekShown);
  }

  if (user.role === 'instructor') {
    return listInstructorWeekDays(user.id, weekShown);
  }

  return buildEmptyWeekDays();
}

async function buildNextSlots(
  user: WeekUser,
): Promise<NextSlot[]> {
  if (user.role !== 'student') return [];

  const rows = await sql`
    WITH now_paris AS (
      SELECT
        (NOW() AT TIME ZONE 'Europe/Paris')::date AS d,
        (NOW() AT TIME ZONE 'Europe/Paris')::time AS t,
        ((NOW() AT TIME ZONE 'Europe/Paris')::date + INTERVAL '5 weeks')::date AS d_max
    )
    SELECT
      s."date"::text AS "date",
      s."startTime" AS "startTime",
      s."endTime" AS "endTime",
      instr."name" AS "counterpartName"
    FROM "Slot" s
    JOIN "User" instr
      ON instr."id" = s."dogsitterUserId"
    JOIN now_paris np ON TRUE
    WHERE s."clientUserId" = ${user.id}
      AND (
        s."date" > np.d
        OR (s."date" = np.d AND s."startTime"::time >= np.t)
      )
      AND s."date" <= np.d_max
    ORDER BY s."date", s."startTime"::time
    LIMIT 4
  `;

  return rows.map((row: any) => ({
    date: row.date as string,
    startTime: row.startTime as string,
    endTime: row.endTime as string,
    counterpartName: (row.counterpartName as string) ?? null,
  }));
}

function slotToPoint(slot: WeekSlot): TravelPoint {
  return {
    lat: slot.lat ?? null,
    lng: slot.lng ?? null,
    formatted_address: slot.formattedAddress ?? null,
  };
}

function slotLabel(slot: WeekSlot): string | null {
  return slot.formattedAddress ?? slot.studentName ?? slot.instructorName ?? null;
}

async function buildTravelSlotsForRole(params: {
  userRow: DbUserRow;
  role: Role;
  days: WeekDay[];
}): Promise<Record<string, TravelSlot[]>> {
  const { userRow, role, days } = params;
  if (role === 'student') return {};

  const travelsByDate: Record<string, TravelSlot[]> = {};
  const cache = createTravelDurationCache();
  const homePoint: TravelPoint = {
    lat: userRow.lat,
    lng: userRow.lng,
    formatted_address: userRow.formatted_address,
  };
  const homeLabel =
    userRow.formatted_address && userRow.formatted_address.trim().length > 0
      ? userRow.formatted_address
      : 'Domicile';

  for (const day of days) {
    if (!day.dayDate || !day.slots.length) continue;

    const slots = sortTimedSlots(day.slots);
    const travelsForDay: TravelSlot[] = [];
    const first = slots[0];
    const firstDuration = await getTravelDurationMinutesWithCache(
      homePoint,
      slotToPoint(first),
      cache,
    );

    if (firstDuration && firstDuration > 0) {
      const slotStartM = timeToMinutes(first.startTime);
      travelsForDay.push({
        date: day.dayDate,
        startTime: minutesToTime(Math.max(0, slotStartM - firstDuration)),
        endTime: minutesToTime(slotStartM),
        fromLabel: homeLabel,
        toLabel: slotLabel(first),
      });
    }

    for (let index = 0; index < slots.length - 1; index += 1) {
      const previous = slots[index];
      const next = slots[index + 1];
      const duration = await getTravelDurationMinutesWithCache(
        slotToPoint(previous),
        slotToPoint(next),
        cache,
      );

      if (!duration || duration <= 0) continue;

      const previousEnd = timeToMinutes(previous.endTime);
      const nextStart = timeToMinutes(next.startTime);
      if (nextStart <= previousEnd) continue;

      const travelEnd = Math.min(previousEnd + duration, nextStart);
      if (travelEnd <= previousEnd) continue;

      travelsForDay.push({
        date: day.dayDate,
        startTime: minutesToTime(previousEnd),
        endTime: minutesToTime(travelEnd),
        fromLabel: slotLabel(previous),
        toLabel: slotLabel(next),
      });
    }

    const last = slots[slots.length - 1];
    const lastDuration = await getTravelDurationMinutesWithCache(
      slotToPoint(last),
      homePoint,
      cache,
    );

    if (lastDuration && lastDuration > 0) {
      const lastEnd = timeToMinutes(last.endTime);
      travelsForDay.push({
        date: day.dayDate,
        startTime: minutesToTime(lastEnd),
        endTime: minutesToTime(lastEnd + lastDuration),
        fromLabel: slotLabel(last),
        toLabel: homeLabel,
      });
    }

    if (travelsForDay.length) {
      travelsByDate[day.dayDate] = travelsForDay;
    }
  }

  return travelsByDate;
}

export async function buildMyWeeksPayload(params: {
  targetUserId: string;
  weekStartParam: string | null;
}): Promise<MyWeeksResult> {
  const userRow = await getWeekUserById(params.targetUserId);
  if (!userRow) {
    return {
      ok: false,
      status: 404,
      body: { error: `User ${params.targetUserId} not found` },
    };
  }

  const weekShown =
    params.weekStartParam && params.weekStartParam.trim().length > 0
      ? params.weekStartParam
      : await getThisMondayISO();

  const user = toWeekUser(userRow);
  const [days, nextSlots] = await Promise.all([
    buildDaysForRole(user, weekShown),
    buildNextSlots(user),
  ]);
  const travelsByDate = await buildTravelSlotsForRole({
    userRow,
    role: user.role,
    days,
  });

  return {
    ok: true,
    payload: {
      weekShown,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      days,
      hasDetailedSlots: true,
      nextSlots,
      travelsByDate,
    },
  };
}
