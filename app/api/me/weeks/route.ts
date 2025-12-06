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

  // ⬇️ nouveaux champs pour coller à LastWeekAgenda.tsx
  serviceName?: string | null;
  servicePrice?: number | string | null;
  formattedAddress?: string | null;
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
        // (serviceName / servicePrice / formattedAddress restent ceux du premier)
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

    // User
    const userRows = await sql`
      SELECT u.id, u.role, u.name, u."agencyId"
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

    const user = userRows[0] as {
      id: string;
      role: Role;
      name: string | null;
      agencyId: string;
    };

    // Semaine affichée : soit paramètre, soit lundi courant
    const weekShown =
      weekStartParam && weekStartParam.trim().length > 0
        ? weekStartParam
        : await getThisMondayISO();

    // === Construire les jours de la semaine ===
    // dayOfWeek = 0..6, dayDate = lundi..dimanche
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
          s."formatted_address"            AS "formattedAddress"
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
              'formattedAddress', s."formattedAddress"
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

          // éventuelle fusion comme avant si tu utilisais mergeIntervalsByKey
          // ici on garde la fusion sur l'instructorName
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
          s."formatted_address"            AS "formattedAddress"
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
              'formattedAddress', s."formattedAddress"
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

          // fusion éventuelle par élève
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

      // Admin ou autre rôle
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
          -- Tu peux aussi ici exposer serviceName/servicePrice si tu veux enrichir la
          -- section "Prochains cours", via un join sur ServicePricing comme ci-dessus.
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

    return NextResponse.json({
      weekShown,
      user: { id: user.id, name: user.name, role: user.role },
      days,
      hasDetailedSlots: true,
      nextSlots,
    });
  } catch (err: any) {
    console.error('[GET /api/agenda/last-week] error', err);
    return NextResponse.json(
      { error: 'Failed to load agenda', detail: err?.message },
      { status: 500 }
    );
  }
}
