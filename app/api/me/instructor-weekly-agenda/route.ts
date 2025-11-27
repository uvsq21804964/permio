// app/api/me/instructor-weekly-agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

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

    // 1) Récupérer l'utilisateur courant pour connaître son agence + rôle
    const [me] = await sql`
      SELECT id, name, role, "agencyId"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (!me) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // 2) Trouver le moniteur de la même agence
    //    - si déjà moniteur -> on se prend soi-même
    //    - sinon -> on cherche role = 'instructor' dans la même agence
    let instructor = me;

    if (me.role !== 'instructor') {
      const [foundInstructor] = await sql`
        SELECT id, name, role
        FROM "User"
        WHERE "agencyId" = ${me.agencyId}
          AND role = 'instructor'
        LIMIT 1
      `;

      if (!foundInstructor) {
        return NextResponse.json(
          { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
          { status: 404 }
        );
      }

      instructor = { ...foundInstructor, agencyId: me.agencyId };
    }

    const instructorId = instructor.id;

    // 3) Semaine type du moniteur
    const defaults = await sql`
      SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
      FROM "Availability"
      WHERE "userId" = ${instructorId}
      ORDER BY "dayOfWeek", "startTime"
    `;

    // 4) Exceptions ponctuelles du moniteur sur cette semaine
    const exceptions = await sql`
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
    `;

    return NextResponse.json(
      {
        weekStart,
        weekEnd,
        instructor: {
          id: instructor.id,
          name: (instructor as any).name ?? null,
          role: instructor.role,
        },
        defaults,
        exceptions,
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
