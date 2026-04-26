import { NextRequest, NextResponse } from 'next/server';
import { requireOrgUser } from '@/lib/api/auth-server';
import {
  authorizeScopedUserDeletion,
  deleteManagedScopedUser,
} from '@/lib/server/services/org-user-management-service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth, response } = requireOrgUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId, orgId } = auth;

    const { id: targetId } = await params;
    if (!targetId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const authorization = await authorizeScopedUserDeletion({
      orgId,
      actorUserId: userId,
      targetUserId: targetId,
    });

    if (!authorization.ok) {
      return NextResponse.json(authorization.body, {
        status: authorization.status,
      });
    }

    await deleteManagedScopedUser({ orgId, userId: targetId });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('[DELETE /api/users/:id] error:', e);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
