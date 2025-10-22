import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

type AvailabilityRow = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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

// 👇 helper : map Clerk org → Agency.id
async function getAgencyIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT "id" FROM "Agency" WHERE "clerk_org_id" = ${clerkOrgId} LIMIT 1
  `;
  return rows.length ? rows[0].id : null;
}

export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!orgId) {
      return NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      );
    }

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    // 🔥 On récupère TOUTES les dispos des ÉLÈVES de l’agence
    // (si tu veux inclure aussi les moniteurs, supprime la clause "AND u.role = 'student'")
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

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch availabilities', detail: err?.message },
      { status: 500 }
    );
  }
}

// 👇 Ton POST actuel peut rester inchangé (création pour l’utilisateur courant)
export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body;

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

    const existingAvailabilities = await sql`
      SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
      FROM "Availability"
      WHERE "userId" = ${userId} AND "dayOfWeek" = ${dayOfWeek}
    `;

    const overlapping = existingAvailabilities.filter((avail: any) =>
      doRangesOverlapOrAdjacent(
        startTime,
        endTime,
        avail.startTime,
        avail.endTime
      )
    );

    let finalStartTime = startTime;
    let finalEndTime = endTime;

    if (overlapping.length > 0) {
      const allTimes = [
        { start: startTime, end: endTime },
        ...overlapping.map((a: any) => ({
          start: a.startTime,
          end: a.endTime,
        })),
      ];

      const minStart = Math.min(...allTimes.map((t) => timeToMinutes(t.start)));
      const maxEnd = Math.max(...allTimes.map((t) => timeToMinutes(t.end)));

      const sH = Math.floor(minStart / 60);
      const sM = minStart % 60;
      const eH = Math.floor(maxEnd / 60);
      const eM = maxEnd % 60;

      finalStartTime = `${String(sH).padStart(2, '0')}:${String(sM).padStart(
        2,
        '0'
      )}`;
      finalEndTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(
        2,
        '0'
      )}`;

      for (const avail of overlapping) {
        await sql`DELETE FROM "Availability" WHERE id = ${avail.id}`;
      }
    }

    const [availability] = await sql`
      INSERT INTO "Availability" (id, "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${userId}, ${dayOfWeek}, ${finalStartTime}, ${finalEndTime}, NOW(), NOW())
      RETURNING *
    `;

    const [user] = await sql`
      SELECT name, role FROM "User" WHERE id = ${userId}
    `;

    return NextResponse.json({ ...availability, user }, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating availability:', error);
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    );
  }
}
