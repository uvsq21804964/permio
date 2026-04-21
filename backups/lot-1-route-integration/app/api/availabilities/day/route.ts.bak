// app/api/day-availabilities/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

type DayAvailabilityRow = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: 'available' | 'unavailable';
  createdAt: string;
  updatedAt: string;
  user: { name: string | null; role: string | null } | null;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const doRangesOverlapOrAdjacent = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);

  return start1Min <= end2Min && start2Min <= end1Min;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const scope = url.searchParams.get('scope');

    // 🔹 1) NOUVEAU CAS : toutes les exceptions à venir
    if (scope === 'upcoming') {
      const rows = await sql`
  SELECT
    id,
    "userId",
    -- 👇 On force une date "YYYY-MM-DD" en texte
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

      return NextResponse.json(rows, { status: 200 });
    }

    // 🔹 2) CAS EXISTANT : par jour précis
    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const rows = await sql`
  SELECT
    id,
    "userId",
    -- 👇 idem ici
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

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/availabilities/day] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch day availabilities', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { date, startTime, endTime, kind } = body as {
      date: string;
      startTime: string;
      endTime: string;
      kind: 'available' | 'unavailable';
    };

    if (!date || !startTime || !endTime || !kind) {
      return NextResponse.json(
        { error: 'date, startTime, endTime et kind sont requis' },
        { status: 400 }
      );
    }

    if (!['available', 'unavailable'].includes(kind)) {
      return NextResponse.json(
        { error: 'kind doit être "available" ou "unavailable"' },
        { status: 400 }
      );
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: "L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      );
    }

    if (startMinutes < 8 * 60 || endMinutes > 20 * 60) {
      return NextResponse.json(
        { error: 'Les horaires doivent être entre 8h00 et 20h00' },
        { status: 400 }
      );
    }

    // On récupère les créneaux existants pour ce jour / type pour fusionner si besoin
    const existing = await sql`
      SELECT id, "startTime", "endTime"
      FROM "DayAvailability"
      WHERE "userId" = ${userId}
        AND "date" = ${date}::date
        AND "kind" = ${kind}
    `;

    const overlapping = existing.filter((row: any) =>
      doRangesOverlapOrAdjacent(startTime, endTime, row.startTime, row.endTime)
    );

    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (overlapping.length > 0) {
      const allTimes = [
        { start: startTime, end: endTime },
        ...overlapping.map((r: any) => ({
          start: r.startTime,
          end: r.endTime,
        })),
      ];

      const minStart = Math.min(...allTimes.map((t) => timeToMinutes(t.start)));
      const maxEnd = Math.max(...allTimes.map((t) => timeToMinutes(t.end)));

      const startH = Math.floor(minStart / 60);
      const startM = minStart % 60;
      const endH = Math.floor(maxEnd / 60);
      const endM = maxEnd % 60;

      finalStartTime = `${startH.toString().padStart(2, '0')}:${startM
        .toString()
        .padStart(2, '0')}`;
      finalEndTime = `${endH.toString().padStart(2, '0')}:${endM
        .toString()
        .padStart(2, '0')}`;

      // On supprime les anciens pour ne garder que le créneau fusionné
      for (const row of overlapping) {
        await sql`
          DELETE FROM "DayAvailability"
          WHERE id = ${row.id}
        `;
      }
    }

    const [inserted] = await sql`
      INSERT INTO "DayAvailability"
        (id, "userId", "date", "startTime", "endTime", "kind", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), ${userId}, ${date}::date, ${finalStartTime}, ${finalEndTime}, ${kind}, NOW(), NOW())
      RETURNING *
    `;

    const [user] = await sql`
      SELECT name, role FROM "User" WHERE id = ${userId}
    `;

    return NextResponse.json({ ...inserted, user }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/day-availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to create day availability', detail: err?.message },
      { status: 500 }
    );
  }
}
