// app/api/schedule/commit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireOrgUser } from '@/lib/api/auth-server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';

type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number; // 0..6 (0 = Lundi)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  duration: number;
};

export const dynamic = 'force-dynamic';

async function computeCurrentMondayISO(): Promise<string> {
  // Lundi ISO de la semaine courante
  const rows = await sql`
    SELECT (CURRENT_DATE - ((EXTRACT(ISODOW FROM CURRENT_DATE)::int - 1)))::date AS monday
  `;
  return rows[0].monday as string;
}

export async function POST(req: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for orgId=${orgId}` },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const matches: Match[] = Array.isArray(body?.matches) ? body.matches : [];
    let weekStart: string | undefined = body?.weekStart;

    if (!matches.length) {
      return NextResponse.json(
        { error: 'No matches to commit' },
        { status: 400 }
      );
    }

    if (!weekStart) {
      weekStart = await computeCurrentMondayISO();
    }

    // 1) Restreindre aux moniteurs de l’agence
    const instructorIds = Array.from(
      new Set(matches.map((m) => m.instructorId))
    );
    if (instructorIds.length === 0) {
      return NextResponse.json(
        { error: 'No instructor in matches' },
        { status: 400 }
      );
    }

    const validInstructors = await sql`
      SELECT u.id
      FROM "User" u
      WHERE u."id" = ANY(${instructorIds}::text[])
        AND u."agencyId" = ${agencyId}
        AND u."role" = 'instructor'
    `;
    const allowed = new Set<string>(validInstructors.map((r: any) => r.id));
    const filtered = matches.filter((m) => allowed.has(m.instructorId));

    if (filtered.length === 0) {
      return NextResponse.json(
        { error: 'No matches for instructors of this agency' },
        { status: 400 }
      );
    }

    // 2) Mettre à jour le lundi de référence pour l’agence
    await sql`
      UPDATE "Agency"
      SET last_week_start = ${weekStart}::date
      WHERE "id" = ${agencyId}
    `;

    // 3) Transaction : UPSERT des InstructorWeekDay + insertion/upsert des WorkSlot
    await sql`BEGIN`;
    try {
      // On regroupe par (instructorId, dayOfWeek)
      const byIwdKey = new Map<string, Match[]>();
      for (const m of filtered) {
        const key = `${m.instructorId}__${m.dayOfWeek}`;
        if (!byIwdKey.has(key)) byIwdKey.set(key, []);
        byIwdKey.get(key)!.push(m);
      }

      // Crée/Met à jour les enregistrements InstructorWeekDay et garde leurs IDs
      const iwdIdByKey = new Map<string, string>();

      for (const [key, items] of byIwdKey.entries()) {
        const { instructorId, dayOfWeek } = items[0];

        // dayDate = weekStart + dayOfWeek (0 = lundi)
        const rows = await sql`
          INSERT INTO "InstructorWeekDay" (
            id, "instructorId", "weekStart", "dayOfWeek", "dayDate", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(),
            ${instructorId},
            ${weekStart}::date,
            ${dayOfWeek},
            (${weekStart}::date + (${dayOfWeek}) * INTERVAL '1 day')::date,
            NOW(),
            NOW()
          )
          ON CONFLICT ("instructorId","weekStart","dayOfWeek")
          DO UPDATE SET
            "dayDate"   = EXCLUDED."dayDate",
            "updatedAt" = NOW()
          RETURNING id
        `;
        const iwdId = rows[0].id as string;
        iwdIdByKey.set(key, iwdId);
      }

      // Insertion / Upsert des WorkSlot
      // IMPORTANT : on utilise la **nouvelle clé unique** ("studentId","instructorWeekDayId","startTime","endTime")
      let inserted = 0;
      for (const m of filtered) {
        const key = `${m.instructorId}__${m.dayOfWeek}`;
        const instructorWeekDayId = iwdIdByKey.get(key);
        if (!instructorWeekDayId) {
          throw new Error(`Missing InstructorWeekDay for key ${key}`);
        }

        await sql`
          INSERT INTO "WorkSlot" (
            id, "studentId", "instructorWeekDayId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(),
            ${m.studentId},
            ${instructorWeekDayId},
            ${m.dayOfWeek},
            ${m.startTime}::time,
            ${m.endTime}::time,
            NOW(),
            NOW()
          )
          ON CONFLICT ("studentId","instructorWeekDayId","startTime","endTime")
          DO UPDATE SET "updatedAt" = NOW()
        `;
        inserted += 1;
      }

      await sql`COMMIT`;

      return NextResponse.json({
        ok: true,
        weekStart,
        instructorsCommitted: allowed.size,
        savedMatches: inserted,
      });
    } catch (e) {
      await sql`ROLLBACK`;
      throw e;
    }
  } catch (err: any) {
    console.error('[schedule/commit] error:', err);
    return NextResponse.json(
      { error: 'Failed to commit schedule', detail: err?.message },
      { status: 500 }
    );
  }
}
