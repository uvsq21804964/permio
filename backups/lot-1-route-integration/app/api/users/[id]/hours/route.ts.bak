// app/api/users/[id]/hours/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

type Role = 'student' | 'instructor' | 'admin';
export const dynamic = 'force-dynamic';

async function getAgencyIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  const rows =
    await sql`SELECT "id" FROM "Agency" WHERE "clerk_org_id" = ${clerkOrgId} LIMIT 1`;
  return rows.length ? rows[0].id : null;
}

async function ensureTargetStudentInAgency(targetId: string, agencyId: string) {
  const rows = await sql`
    SELECT id, role, "agencyId", planned_minutes, remaining_minutes
    FROM "User"
    WHERE id = ${targetId}
    LIMIT 1
  `;
  if (rows.length === 0) return { error: 'User not found' as const };
  const u = rows[0] as {
    id: string;
    role: Role;
    agencyId: string;
    planned_minutes: number;
    remaining_minutes: number;
  };
  if (u.agencyId !== agencyId)
    return { error: 'Forbidden (different agency)' as const };
  if (u.role !== 'student')
    return { error: 'Only students can be updated' as const };
  return { user: u };
}

/** PATCH: ajoute deltaMinutes (ex: +60 pour “Ajouter 1h”) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = getAuth(request, {
      treatPendingAsSignedOut: false,
    });
    if (!userId)
      return NextResponse.json(
        { error: 'Unauthorized (no userId)' },
        { status: 401 }
      );
    if (!orgId)
      return NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      );

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId)
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );

    const targetId = params.id;
    if (!targetId)
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const deltaMinutes = Number.isFinite(Number(body?.deltaMinutes))
      ? Math.trunc(Number(body.deltaMinutes))
      : 60;
    if (deltaMinutes <= 0)
      return NextResponse.json(
        { error: 'deltaMinutes must be > 0' },
        { status: 400 }
      );

    const check = await ensureTargetStudentInAgency(targetId, agencyId);
    if ('error' in check)
      return NextResponse.json(
        { error: check.error },
        { status: check.error.includes('Forbidden') ? 403 : 400 }
      );

    const updated = await sql`
      UPDATE "User"
      SET
        planned_minutes   = planned_minutes   + ${deltaMinutes},
        remaining_minutes = remaining_minutes + ${deltaMinutes},
        "updatedAt" = NOW()
      WHERE id = ${targetId} AND "agencyId" = ${agencyId} AND role = 'student'
      RETURNING
        id, name, role, "agencyId", "createdAt", "updatedAt",
        planned_minutes AS "plannedMinutes",
        remaining_minutes AS "remainingMinutes"
    `;
    if (updated.length === 0)
      return NextResponse.json({ error: 'Update failed' }, { status: 400 });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('[api/users/[id]/hours] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update hours' },
      { status: 500 }
    );
  }
}

/** PUT: fixe plannedMinutes & remainingMinutes (borné: remaining ≤ planned) */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = getAuth(request, {
      treatPendingAsSignedOut: false,
    });
    if (!userId)
      return NextResponse.json(
        { error: 'Unauthorized (no userId)' },
        { status: 401 }
      );
    if (!orgId)
      return NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      );

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId)
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );

    const targetId = params.id;
    if (!targetId)
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const planned = Math.trunc(Number(body?.plannedMinutes));
    const remaining = Math.trunc(Number(body?.remainingMinutes));
    if (!Number.isFinite(planned) || planned < 0)
      return NextResponse.json(
        { error: 'plannedMinutes must be ≥ 0' },
        { status: 400 }
      );
    if (!Number.isFinite(remaining) || remaining < 0)
      return NextResponse.json(
        { error: 'remainingMinutes must be ≥ 0' },
        { status: 400 }
      );

    const check = await ensureTargetStudentInAgency(targetId, agencyId);
    if ('error' in check)
      return NextResponse.json(
        { error: check.error },
        { status: check.error.includes('Forbidden') ? 403 : 400 }
      );

    const boundedRemaining = Math.min(remaining, planned);

    const updated = await sql`
      UPDATE "User"
      SET
        planned_minutes   = ${planned},
        remaining_minutes = ${boundedRemaining},
        "updatedAt" = NOW()
      WHERE id = ${targetId} AND "agencyId" = ${agencyId} AND role = 'student'
      RETURNING
        id, name, role, "agencyId", "createdAt", "updatedAt",
        planned_minutes AS "plannedMinutes",
        remaining_minutes AS "remainingMinutes"
    `;
    if (updated.length === 0)
      return NextResponse.json({ error: 'Update failed' }, { status: 400 });

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('[api/users/[id]/hours] PUT error:', error);
    return NextResponse.json({ error: 'Failed to set hours' }, { status: 500 });
  }
}
