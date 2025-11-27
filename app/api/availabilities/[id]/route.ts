// api/availabilities/[id]

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } } // ⬅️ pas une Promise
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

    // Optionnel: vérifier l’existence + appartenance
    const exists = await sql`
      SELECT id
      FROM "Availability"
      WHERE id = ${id} AND "userId" = ${userId}
      LIMIT 1
    `;
    if (exists.length === 0) {
      // soit introuvable, soit pas propriétaire
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await sql`
      DELETE FROM "Availability"
      WHERE id = ${id} AND "userId" = ${userId}
    `;

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (err) {
    console.error('[DELETE /api/availabilities/:id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}
