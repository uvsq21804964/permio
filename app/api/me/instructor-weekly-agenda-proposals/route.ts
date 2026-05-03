// app/api/me/instructor-weekly-agenda/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  addDaysISO,
  dateToISO,
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

    // 📅 Point de départ de la plage :
    // - si weekStart est fourni → on l’utilise tel quel (YYYY-MM-DD)
    // - sinon → aujourd’hui (date locale du serveur)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = dateToISO(today);

    const rangeStart =
      weekStartParam && weekStartParam.trim().length > 0
        ? weekStartParam.slice(0, 10)
        : todayISO;

    const rangeEnd = addDaysISO(rangeStart, 41);
    const clientLatParam = url.searchParams.get('clientLat');
    const clientLngParam = url.searchParams.get('clientLng');
    const clientFormattedParam = url.searchParams.get('clientFormatted');
    const targetClientUserId = url.searchParams.get('clientUserId');
    const result = await buildInstructorAgenda({
      userId,
      startDate: rangeStart,
      endDate: rangeEnd,
      clientLatParam,
      clientLngParam,
      clientFormattedParam,
      targetClientUserId,
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
