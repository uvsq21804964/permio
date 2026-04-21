// app/api/day-availabilities/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const exists = await sql`
      SELECT id
      FROM "DayAvailability"
      WHERE id = ${id} AND "userId" = ${userId}
      LIMIT 1
    `;
    if (exists.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await sql`
      DELETE FROM "DayAvailability"
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('[DELETE /api/day-availabilities/:id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete day availability', detail: err?.message },
      { status: 500 }
    );
  }
}
