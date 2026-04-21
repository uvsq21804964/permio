import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import { buildMyWeeksPayload } from '@/lib/server/services/my-weeks-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const userIdParam = req.nextUrl.searchParams.get('userId');
    const weekStartParam = req.nextUrl.searchParams.get('weekStart');
    const result = await buildMyWeeksPayload({
      targetUserId: userIdParam || auth.userId,
      weekStartParam,
    });

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.payload, { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/me/weeks] error', error);
    return NextResponse.json(
      {
        error: 'Failed to load agenda',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}
