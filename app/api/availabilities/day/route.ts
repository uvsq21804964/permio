// app/api/day-availabilities/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  deleteDayAvailabilitiesByIds,
  getAvailabilityUserSummary,
  insertDayAvailability,
  listDayAvailabilitiesByDate,
  listDayAvailabilityRanges,
  listUpcomingDayAvailabilities,
} from '@/lib/server/repositories/availability-repository';
import {
  mergeWithExistingRanges,
  validateDayAvailabilityInput,
} from '@/lib/server/services/availability-service';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const scope = url.searchParams.get('scope');

    if (scope === 'upcoming') {
      const rows = await listUpcomingDayAvailabilities(userId);
      return NextResponse.json(rows, { status: 200 });
    }

    if (!date) {
      return NextResponse.json({ error: 'Missing date' }, { status: 400 });
    }

    const rows = await listDayAvailabilitiesByDate(userId, date);
    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/availabilities/day] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch day availabilities', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const body = await req.json();
    const { date, startTime, endTime, kind } = body as {
      date: string;
      startTime: string;
      endTime: string;
      kind: 'available' | 'unavailable';
    };

    const validation = validateDayAvailabilityInput({
      date,
      startTime,
      endTime,
      kind,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await listDayAvailabilityRanges(userId, date, kind);
    const merged = mergeWithExistingRanges({ startTime, endTime }, existing);

    if (merged.mergedIds.length > 0) {
      await deleteDayAvailabilitiesByIds(merged.mergedIds);
    }

    const inserted = await insertDayAvailability({
      userId,
      date,
      startTime: merged.startTime,
      endTime: merged.endTime,
      kind,
    });

    const user = await getAvailabilityUserSummary(userId);

    return NextResponse.json({ ...inserted, user }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/day-availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to create day availability', detail: err?.message },
      { status: 500 }
    );
  }
}
