import { type NextRequest, NextResponse } from 'next/server';
import { requireOrgUser } from '@/lib/api/auth-server';
import {
  buildAgencyUserCreateInput,
  createManagedAgencyUser,
  listAgencyUsersWithEmails,
  resolveAgencyIdForOrg,
} from '@/lib/server/services/org-user-management-service';
import type { OrgManagedRole } from '@/lib/server/repositories/org-user-management-repository';

export const dynamic = 'force-dynamic';

type Role = 'student' | 'instructor' | 'admin';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

    const agencyId = await resolveAgencyIdForOrg(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const roleParam = request.nextUrl.searchParams.get('role') as Role | null;
    const enriched = await listAgencyUsersWithEmails({
      agencyId,
      role: roleParam as OrgManagedRole | null,
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('[api/users] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

    const agencyId = await resolveAgencyIdForOrg(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body?.name ?? '').toString().trim();
    const role = (body?.role ?? '').toString().trim() as Role;

    if (!name || !role) {
      return NextResponse.json(
        { error: 'Missing name or role' },
        { status: 400 }
      );
    }

    const input = await buildAgencyUserCreateInput({
      name,
      role: role as OrgManagedRole,
      plannedMinutesInput: body?.plannedMinutes,
      remainingMinutesInput: body?.remainingMinutes,
    });

    const created = await createManagedAgencyUser({
      agencyId,
      name: input.name,
      role: input.role,
      plannedMinutes: input.plannedMinutes,
      remainingMinutes: input.remainingMinutes,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[api/users] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
