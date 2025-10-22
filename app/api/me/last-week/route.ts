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
};

/** Fusionne les créneaux qui se touchent OU se chevauchent, par clé. */
function mergeIntervalsByKey<T extends AnySlot>(
  slots: T[],
  getKey: (s: T) => string
): T[] {
  if (!Array.isArray(slots) || slots.length === 0) return [];

  // 1) Regrouper par clé
  const groups = new Map<string, T[]>();
  for (const s of slots) {
    const k = (getKey(s) ?? '').trim();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  }

  // 2) Fusionner au sein de chaque groupe (chevauchement ou contiguïté)
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

      // Si ça se touche ou se chevauche: start <= current.end
      if (s.startTime <= current.endTime) {
        // Étendre la fin si nécessaire
        if (s.endTime > current.endTime) current.endTime = s.endTime;
      } else {
        mergedAll.push(current);
        current = { ...s };
      }
    }
    if (current) mergedAll.push(current);
  }

  // 3) Réassembler & trier par heure de début
  return mergedAll.sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Fusionne les créneaux consécutifs (end == start) pour une même clé (personne). */
function mergeSequentialByKey<T extends AnySlot>(
  slots: T[],
  getKey: (s: T) => string
): T[] {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  // On s'assure de l'ordre par heure de début
  const sorted = [...slots].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  const merged: T[] = [];
  for (const s of sorted) {
    const last = merged[merged.length - 1];
    if (last && getKey(last) === getKey(s) && last.endTime === s.startTime) {
      // on étire le créneau précédent
      last.endTime = s.endTime;
    } else {
      merged.push({ ...s });
    }
  }
  return merged;
}

/** Renvoie [thisMonday, nextMonday] en 'YYYY-MM-DD' (Europe/Paris) */
async function getMondaysISO(): Promise<{
  thisMonday: string;
  nextMonday: string;
}> {
  const rows = await sql`
    WITH today AS (
      SELECT (NOW() AT TIME ZONE 'Europe/Paris')::date AS d
    ),
    monday_this AS (
      -- Lundi de la semaine courante (ISO : lundi=1)
      SELECT (d - (EXTRACT(ISODOW FROM d)::int - 1))::date AS m
      FROM today
    )
    SELECT
      m::text                         AS this_monday,
      (m + INTERVAL '7 days')::date::text AS next_monday
    FROM monday_this
  `;
  return {
    thisMonday: rows[0].this_monday as string,
    nextMonday: rows[0].next_monday as string,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { userId: authUserId } = getAuth(req, {
      treatPendingAsSignedOut: false,
    });
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userIdParam = req.nextUrl.searchParams.get('userId');
    const targetUserId = userIdParam || authUserId;

    // User + dernière semaine validée (castée en texte)
    const userRows = await sql`
      SELECT u.id, u.role, u.name, u."agencyId",
             u."last_validated_week_start"::text AS "last_validated_week_start"
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
      last_validated_week_start: string | null;
    };

    // On a besoin de S (thisMonday) pour afficher, et S+1 (nextMonday) pour le gating
    const { thisMonday, nextMonday } = await getMondaysISO();

    // Gating: exiger validation des dispos pour S+1
    if (
      !user.last_validated_week_start ||
      user.last_validated_week_start !== nextMonday
    ) {
      return NextResponse.json(
        {
          error: 'Week not validated',
          requireValidationFor: nextMonday,
          message:
            "Veuillez valider vos disponibilités pour la semaine prochaine avant d'accéder à l'agenda.",
        },
        { status: 428 }
      );
    }

    // === ÉLÈVE : WorkSlot de la semaine COURANTE (S) ===
    if (user.role === 'student') {
      const days = await sql`
        WITH days AS (
          SELECT d."dayOfWeek",
                 (${thisMonday}::date + d."dayOfWeek")::date AS "dayDate"
          FROM (VALUES (0),(1),(2),(3),(4),(5),(6)) AS d("dayOfWeek")
        ),
        slots AS (
          SELECT
            iwd."dayOfWeek"                    AS "dayOfWeek",
            to_char(w."startTime",'HH24:MI')   AS "startTime",
            to_char(w."endTime",'HH24:MI')     AS "endTime",
            instr."name"                       AS "instructorName"
          FROM "WorkSlot" w
          JOIN "InstructorWeekDay" iwd
            ON iwd."id" = w."instructorWeekDayId"
          JOIN "User" instr
            ON instr."id" = iwd."instructorId"
          WHERE w."studentId" = ${targetUserId}
            AND iwd."weekStart" = ${thisMonday}::date   -- <=== SEMAINE COURANTE
        )
        SELECT
          days."dayOfWeek",
          days."dayDate"::text AS "dayDate",
          COALESCE(
            json_agg(
              json_build_object(
                'startTime',       s."startTime",
                'endTime',         s."endTime",
                'instructorName',  s."instructorName"
              )
              ORDER BY s."startTime"
            ) FILTER (WHERE s."dayOfWeek" IS NOT NULL),
            '[]'::json
          ) AS slots
        FROM days
        LEFT JOIN slots s
          ON s."dayOfWeek" = days."dayOfWeek"
        GROUP BY days."dayOfWeek", days."dayDate"
        ORDER BY days."dayOfWeek"
      `;

      const daysMerged = days.map((r: any) => {
        const rawSlots = (r.slots ?? []) as AnySlot[];

        // côté élève (clé = moniteur)
        const mergedSlots = mergeIntervalsByKey(rawSlots, (s) =>
          (s.instructorName ?? '').trim()
        );

        return {
          dayOfWeek: Number(r.dayOfWeek),
          dayDate: r.dayDate,
          slots: mergedSlots,
        };
      });

      return NextResponse.json({
        weekShown: thisMonday, // S
        gatedOn: nextMonday, // S+1
        user: { id: user.id, name: user.name, role: user.role },
        days: daysMerged,
        hasDetailedSlots: true,
      });
    }

    // === MONITEUR : Jours + slots de la semaine COURANTE (S) ===
    if (user.role === 'instructor') {
      const rows = await sql`
        WITH base_days AS (
          SELECT
            iwd."dayOfWeek"     AS "dayOfWeek",
            iwd."dayDate"::text AS "dayDate",
            iwd."id"            AS "instructorWeekDayId"
          FROM "InstructorWeekDay" iwd
          WHERE iwd."instructorId" = ${targetUserId}
            AND iwd."weekStart"    = ${thisMonday}::date -- <=== SEMAINE COURANTE
        ),
        slots AS (
          SELECT
            iwd."dayOfWeek"                     AS "dayOfWeek",
            to_char(w."startTime",'HH24:MI')    AS "startTime",
            to_char(w."endTime",'HH24:MI')      AS "endTime",
            s."name"                            AS "studentName",
            s."id"                              AS "studentId"
          FROM "WorkSlot" w
          JOIN "InstructorWeekDay" iwd
            ON iwd."id" = w."instructorWeekDayId"
          JOIN "User" s
            ON s."id" = w."studentId"
          WHERE iwd."instructorId" = ${targetUserId}
            AND iwd."weekStart"    = ${thisMonday}::date -- <=== SEMAINE COURANTE
        )
        SELECT
          d."dayOfWeek",
          d."dayDate",
          COALESCE(
            json_agg(
              json_build_object(
                'startTime',   s."startTime",
                'endTime',     s."endTime",
                'studentId',   s."studentId",
                'studentName', s."studentName"
              )
              ORDER BY s."startTime"
            ) FILTER (WHERE s."dayOfWeek" IS NOT NULL),
            '[]'::json
          ) AS slots
        FROM base_days d
        LEFT JOIN slots s
          ON s."dayOfWeek" = d."dayOfWeek"
        GROUP BY d."dayOfWeek", d."dayDate"
        ORDER BY d."dayOfWeek"
      `;

      const map = new Map<number, { dayDate: string | null; slots: any[] }>();
      rows.forEach((r: any) =>
        map.set(Number(r.dayOfWeek), {
          dayDate: r.dayDate as string,
          slots: Array.isArray(r.slots) ? r.slots : [],
        })
      );

      const fullWeek = Array.from({ length: 7 }, (_, d) => {
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

      return NextResponse.json({
        weekShown: thisMonday, // S
        gatedOn: nextMonday, // S+1
        user: { id: user.id, name: user.name, role: user.role },
        days: fullWeek,
        hasDetailedSlots: true,
      });
    }

    // Rôle non concerné
    return NextResponse.json({
      weekShown: thisMonday,
      gatedOn: nextMonday,
      user: { id: user.id, name: user.name, role: user.role },
      days: [],
      hasDetailedSlots: false,
      note: 'Aucun agenda associé à ce rôle.',
    });
  } catch (err: any) {
    console.error('[GET /api/agenda/last-week] error', err);
    return NextResponse.json(
      { error: 'Failed to load agenda', detail: err?.message },
      { status: 500 }
    );
  }
}
