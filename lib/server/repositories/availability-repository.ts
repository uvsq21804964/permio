import { sql } from '@/lib/db';

export type AvailabilityUserSummary = {
  name: string | null;
  role: string | null;
};

export type AvailabilityRow = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  user: AvailabilityUserSummary | null;
};

export type DayAvailabilityKind = 'available' | 'unavailable';

export type DayAvailabilityRow = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: DayAvailabilityKind;
  createdAt: string;
  updatedAt: string;
  user?: AvailabilityUserSummary | null;
};

export async function listUserAvailabilities(
  userId: string
): Promise<AvailabilityRow[]> {
  const rows = await sql`
    SELECT
      a.id,
      a."userId",
      a."dayOfWeek",
      a."startTime",
      a."endTime",
      a."createdAt",
      a."updatedAt",
      json_build_object('name', u.name, 'role', u.role) AS user
    FROM "Availability" a
    LEFT JOIN "User" u ON u.id = a."userId"
    WHERE a."userId" = ${userId}
    ORDER BY a."dayOfWeek", a."startTime"
  `;

  return rows as AvailabilityRow[];
}

export async function listAgencyStudentAvailabilities(
  agencyId: string
): Promise<AvailabilityRow[]> {
  const rows = await sql`
    SELECT
      a.id,
      a."userId",
      a."dayOfWeek",
      a."startTime",
      a."endTime",
      a."createdAt",
      a."updatedAt",
      json_build_object('name', u.name, 'role', u.role) AS user
    FROM "Availability" a
    INNER JOIN "User" u ON u.id = a."userId"
    WHERE u."agencyId" = ${agencyId}
      AND u.role = 'student'
    ORDER BY a."dayOfWeek", a."startTime"
  `;

  return rows as AvailabilityRow[];
}

export async function listAvailabilityRangesForDay(
  userId: string,
  dayOfWeek: number
) {
  const rows = await sql`
    SELECT id, "startTime", "endTime"
    FROM "Availability"
    WHERE "userId" = ${userId}
      AND "dayOfWeek" = ${dayOfWeek}
  `;

  return rows as Array<{ id: string; startTime: string; endTime: string }>;
}

export async function deleteAvailabilitiesByIdsForUser(
  userId: string,
  ids: string[]
) {
  for (const id of ids) {
    await sql`
      DELETE FROM "Availability"
      WHERE id = ${id} AND "userId" = ${userId}
    `;
  }
}

export async function insertAvailability(params: {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}) {
  const rows = await sql`
    INSERT INTO "Availability"
      (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid(), ${params.userId}, ${params.dayOfWeek}, ${params.startTime}, ${params.endTime}, NOW(), NOW())
    RETURNING *
  `;

  return rows[0];
}

export async function replaceUserAvailabilities(
  userId: string,
  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>
) {
  await sql`DELETE FROM "Availability" WHERE "userId" = ${userId}`;

  for (const availability of availabilities) {
    await sql`
      INSERT INTO "Availability" (
        "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt"
      ) VALUES (
        ${userId},
        ${availability.dayOfWeek},
        ${availability.startTime},
        ${availability.endTime},
        NOW(),
        NOW()
      )
    `;
  }
}

export async function getAvailabilityUserSummary(
  userId: string
): Promise<AvailabilityUserSummary | null> {
  const rows = await sql`
    SELECT name, role FROM "User" WHERE id = ${userId}
  `;

  return rows.length > 0 ? (rows[0] as AvailabilityUserSummary) : null;
}

export async function listUpcomingDayAvailabilities(userId: string) {
  const rows = await sql`
    SELECT
      id,
      "userId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      kind,
      "createdAt",
      "updatedAt"
    FROM "DayAvailability"
    WHERE "userId" = ${userId}
      AND "date" >= CURRENT_DATE
    ORDER BY "date", "startTime"
  `;

  return rows as DayAvailabilityRow[];
}

export async function listDayAvailabilitiesByDate(
  userId: string,
  date: string
) {
  const rows = await sql`
    SELECT
      id,
      "userId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      kind,
      "createdAt",
      "updatedAt"
    FROM "DayAvailability"
    WHERE "userId" = ${userId}
      AND "date" = ${date}::date
    ORDER BY "startTime"
  `;

  return rows as DayAvailabilityRow[];
}

export async function listDayAvailabilityRanges(
  userId: string,
  date: string,
  kind: DayAvailabilityKind
) {
  const rows = await sql`
    SELECT id, "startTime", "endTime"
    FROM "DayAvailability"
    WHERE "userId" = ${userId}
      AND "date" = ${date}::date
      AND "kind" = ${kind}
  `;

  return rows as Array<{ id: string; startTime: string; endTime: string }>;
}

export async function deleteDayAvailabilitiesByIds(ids: string[]) {
  for (const id of ids) {
    await sql`
      DELETE FROM "DayAvailability"
      WHERE id = ${id}
    `;
  }
}

export async function insertDayAvailability(params: {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: DayAvailabilityKind;
}) {
  const rows = await sql`
    INSERT INTO "DayAvailability"
      (id, "userId", "date", "startTime", "endTime", "kind", "createdAt", "updatedAt")
    VALUES
      (gen_random_uuid(), ${params.userId}, ${params.date}::date, ${params.startTime}, ${params.endTime}, ${params.kind}, NOW(), NOW())
    RETURNING *
  `;

  return rows[0];
}

export async function getDayAvailabilityForUser(
  id: string,
  userId: string
) {
  const rows = await sql`
    SELECT id
    FROM "DayAvailability"
    WHERE id = ${id}
      AND "userId" = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function deleteDayAvailabilityForUser(id: string, userId: string) {
  await sql`
    DELETE FROM "DayAvailability"
    WHERE id = ${id} AND "userId" = ${userId}
  `;
}
