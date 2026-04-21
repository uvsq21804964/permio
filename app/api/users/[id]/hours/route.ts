// app/api/users/[id]/hours/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { requireOrgUser } from '@/lib/api/auth-server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';
import {
  incrementStudentHours,
  setStudentHours,
} from '@/lib/server/repositories/org-user-management-repository';
import { getStudentHours } from '@/lib/server/repositories/user-repository';

type Role = 'student' | 'instructor' | 'admin';
export const dynamic = 'force-dynamic';

async function ensureTargetStudentInAgency(targetId: string, agencyId: string) {
  const u = await getStudentHours(targetId);
  if (!u) return { error: 'User not found' as const };
  const user = u as {
    id: string;
    role: Role;
    agencyId: string;
    planned_minutes: number;
    remaining_minutes: number;
  };
  if (user.agencyId !== agencyId)
    return { error: 'Forbidden (different agency)' as const };
  if (user.role !== 'student')
    return { error: 'Only students can be updated' as const };
  return { user };
}

function statusFromStudentCheck(error: string) {
  return error.includes('Forbidden') ? 403 : 400;
}

/** PATCH: ajoute deltaMinutes (ex: +60 pour “Ajouter 1h”) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

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
    if ('error' in check && check.error)
      return NextResponse.json(
        { error: check.error },
        { status: statusFromStudentCheck(check.error) }
      );

    const updated = await incrementStudentHours({
      userId: targetId,
      agencyId,
      deltaMinutes,
    });
    if (!updated)
      return NextResponse.json({ error: 'Update failed' }, { status: 400 });

    return NextResponse.json(updated);
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
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

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
    if ('error' in check && check.error)
      return NextResponse.json(
        { error: check.error },
        { status: statusFromStudentCheck(check.error) }
      );

    const boundedRemaining = Math.min(remaining, planned);

    const updated = await setStudentHours({
      userId: targetId,
      agencyId,
      plannedMinutes: planned,
      remainingMinutes: boundedRemaining,
    });
    if (!updated)
      return NextResponse.json({ error: 'Update failed' }, { status: 400 });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[api/users/[id]/hours] PUT error:', error);
    return NextResponse.json({ error: 'Failed to set hours' }, { status: 500 });
  }
}
