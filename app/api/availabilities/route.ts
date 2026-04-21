// app/api/availabilities/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  deleteAvailabilitiesByIdsForUser,
  getAvailabilityUserSummary,
  insertAvailability,
  listAvailabilityRangesForDay,
  listUserAvailabilities,
} from '@/lib/server/repositories/availability-repository';
import {
  mergeWithExistingRanges,
  validateWeeklyAvailabilityInput,
} from '@/lib/server/services/availability-service';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const rows = await listUserAvailabilities(userId);

    return NextResponse.json(rows, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch availabilities', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = requireUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const body = await request.json();
    const { dayOfWeek, startTime, endTime } = body as {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };

    const validation = validateWeeklyAvailabilityInput({
      dayOfWeek,
      startTime,
      endTime,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existing = await listAvailabilityRangesForDay(userId, dayOfWeek);
    const merged = mergeWithExistingRanges({ startTime, endTime }, existing);

    if (merged.mergedIds.length > 0) {
      await deleteAvailabilitiesByIdsForUser(userId, merged.mergedIds);
    }

    const availability = await insertAvailability({
      userId,
      dayOfWeek,
      startTime: merged.startTime,
      endTime: merged.endTime,
    });

    const user = await getAvailabilityUserSummary(userId);

    return NextResponse.json({ ...availability, user }, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/availabilities] error:', err);
    return NextResponse.json(
      { error: 'Failed to create availability', detail: err?.message },
      { status: 500 }
    );
  }
}
