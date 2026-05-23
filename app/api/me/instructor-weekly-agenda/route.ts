// app/api/me/instructor-weekly-agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  addDaysISO,
  startOfWeekMondayISO,
} from '@/lib/server/services/agenda-date';
import { buildInstructorAgenda } from '@/lib/server/services/instructor-agenda-service';

// ---------- Handler principal ----------

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const url = new URL(req.url);
    const weekStartParam = url.searchParams.get('weekStart');
    const weekStart = startOfWeekMondayISO(weekStartParam || undefined);
    const weekEnd = addDaysISO(weekStart, 6);
    const clientLatParam = url.searchParams.get('clientLat');
    const clientLngParam = url.searchParams.get('clientLng');
    const clientFormattedParam = url.searchParams.get('clientFormatted');
    const isRemote = url.searchParams.get('isRemote') === '1';
    const targetClientUserId = url.searchParams.get('clientUserId');
    const serviceIdParam = url.searchParams.get('serviceId');
    const serviceId =
      serviceIdParam && Number.isFinite(Number(serviceIdParam))
        ? Number(serviceIdParam)
        : null;
    const result = await buildInstructorAgenda({
      userId,
      startDate: weekStart,
      endDate: weekEnd,
      clientLatParam,
      clientLngParam,
      clientFormattedParam,
      isRemote,
      targetClientUserId,
      serviceId,
    });

    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(result.payload, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/me/instructor-weekly-agenda] error:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch instructor weekly agenda',
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}
