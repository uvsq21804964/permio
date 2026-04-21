// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import { getUserById } from '@/lib/server/repositories/user-repository';

export async function GET(req: NextRequest) {
  const { auth } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }
  const { userId } = auth;

  try {
    const user = await getUserById(userId);
    const exists = !!user;

    return NextResponse.json(
      {
        exists,
        user: exists
          ? {
              id: user.id,
              role: user.role,
              agencyId: user.agencyId,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to load user', details: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
