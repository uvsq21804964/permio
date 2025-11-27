// app/api/availabilities/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

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

  // chevauchement ou juste collés (ex: 09:00–10:00 et 10:00–11:00)
  return start1Min <= end2Min && start2Min <= end1Min;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch availabilities', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };

    if (
      typeof dayOfWeek !== 'number' ||
      dayOfWeek < 0 ||
      dayOfWeek > 6 ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: 'Missing or invalid dayOfWeek, startTime or endTime' },
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

    // On récupère les créneaux existants pour ce jour
    const existing = await sql`
      SELECT id, "startTime", "endTime"
      FROM "Availability"
      WHERE "userId" = ${userId}
        AND "dayOfWeek" = ${dayOfWeek}
    `;

    // On cherche les chevauchements
    const overlapping = existing.filter((a) =>
      doRangesOverlapOrAdjacent(startTime, endTime, a.startTime, a.endTime)
    );

    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (overlapping.length > 0) {
      const allTimes = [
        { start: startTime, end: endTime },
        ...overlapping.map((a) => ({ start: a.startTime, end: a.endTime })),
      ];

      const startMin = Math.min(...allTimes.map((t) => timeToMinutes(t.start)));
      const endMin = Math.max(...allTimes.map((t) => timeToMinutes(t.end)));

      const sh = Math.floor(startMin / 60);
      const sm = startMin % 60;
      const eh = Math.floor(endMin / 60);
      const em = endMin % 60;

      finalStartTime = `${String(sh).padStart(2, '0')}:${String(sm).padStart(
        2,
        '0'
      )}`;
      finalEndTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(
        2,
        '0'
      )}`;

      // on supprime les anciens créneaux fusionnés
      for (const a of overlapping) {
        await sql`
          DELETE FROM "Availability"
          WHERE id = ${a.id} AND "userId" = ${userId}
        `;
      }
    }

    const [availability] = await sql`
      INSERT INTO "Availability"
        (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
      VALUES
        (gen_random_uuid(), ${userId}, ${dayOfWeek}, ${finalStartTime}, ${finalEndTime}, NOW(), NOW())
      RETURNING *
    `;

    const [user] = await sql`
      SELECT name, role FROM "User" WHERE id = ${userId}
    `;

    return NextResponse.json({ ...availability, user }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to create availability', detail: err?.message },
      { status: 500 }
    );
  }
}
