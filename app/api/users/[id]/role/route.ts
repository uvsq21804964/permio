import { NextRequest, NextResponse } from 'next/server';
import { requireOrgUser } from '@/lib/api/auth-server';
import {
  authorizeScopedRoleChange,
  changeManagedScopedUserRole,
} from '@/lib/server/services/org-user-management-service';
import type { OrgManagedRole } from '@/lib/server/repositories/org-user-management-repository';

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { auth, response } = requireOrgUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId, orgId } = auth;

    const targetId = context.params.id;
    const body = await req.json().catch(() => ({}));
    const roleReq = body?.role as OrgManagedRole | undefined;

    if (!roleReq) {
      return NextResponse.json({ error: 'Missing role' }, { status: 400 });
    }
    if (!targetId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const authorization = await authorizeScopedRoleChange({
      orgId,
      actorUserId: userId,
      targetUserId: targetId,
      role: roleReq,
    });

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    const updated = await changeManagedScopedUserRole({
      orgId,
      userId: targetId,
      role: roleReq,
    });

    if (!updated) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('[PATCH /api/users/:id/role] error:', e);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
