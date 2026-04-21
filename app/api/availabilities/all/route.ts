import { type NextRequest, NextResponse } from 'next/server';
import { requireOrgUser, requireUser } from '@/lib/api/auth-server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';
import {
  deleteAvailabilitiesByIdsForUser,
  getAvailabilityUserSummary,
  insertAvailability,
  listAgencyStudentAvailabilities,
  listAvailabilityRangesForDay,
} from '@/lib/server/repositories/availability-repository';
import {
  mergeWithExistingRanges,
  validateWeeklyAvailabilityInput,
} from '@/lib/server/services/availability-service';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const rows = await listAgencyStudentAvailabilities(agencyId);

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
    const { dayOfWeek, startTime, endTime } = body;

    const validation = validateWeeklyAvailabilityInput({
      dayOfWeek,
      startTime,
      endTime,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const existingAvailabilities = await listAvailabilityRangesForDay(
      userId,
      dayOfWeek
    );
    const merged = mergeWithExistingRanges(
      { startTime, endTime },
      existingAvailabilities
    );

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
  } catch (error) {
    console.error('[v0] Error creating availability:', error);
    return NextResponse.json(
      { error: 'Failed to create availability' },
      { status: 500 }
    );
  }
}
