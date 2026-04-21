// app/api/day-availabilities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  deleteDayAvailabilityForUser,
  getDayAvailabilityForUser,
} from '@/lib/server/repositories/availability-repository';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const exists = await getDayAvailabilityForUser(id, userId);
    if (!exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await deleteDayAvailabilityForUser(id, userId);

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('[DELETE /api/day-availabilities/:id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete day availability', detail: err?.message },
      { status: 500 }
    );
  }
}
