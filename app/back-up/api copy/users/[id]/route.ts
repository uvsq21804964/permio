// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!orgId)
      return NextResponse.json(
        { error: 'No active organization' },
        { status: 403 }
      );

    const me = await sql`
      SELECT u.role
      FROM "User" u
      CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _cfg
      WHERE u.id = ${userId}
      LIMIT 1
    `;
    const meRole = me[0]?.role ?? 'student';
    if (meRole !== 'instructor' && meRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const targetId = params.id;
    if (!targetId)
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (targetId === userId)
      return NextResponse.json(
        { error: 'Cannot delete self' },
        { status: 400 }
      );

    const target = await sql`
      SELECT u.role
      FROM "User" u
      CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _cfg
      WHERE u.id = ${targetId}
      LIMIT 1
    `;
    if (target.length === 0)
      return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Un moniteur ne peut supprimer qu'un élève
    if (meRole === 'instructor' && target[0].role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`
      WITH _cfg AS (SELECT set_config('app.agency_id', ${orgId}, true))
      DELETE FROM "User" WHERE id = ${targetId}
    `;
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    console.error('[DELETE /api/users/:id] error:', e);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
