// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId) {
    return NextResponse.json({ exists: false }, { status: 200 });
  }

  try {
    const rows = await sql`
      SELECT id, role, "agencyId"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;

    const exists = Array.isArray(rows) && rows.length > 0;

    return NextResponse.json(
      {
        exists,
        user: exists
          ? {
              id: rows[0].id,
              role: rows[0].role,
              agencyId: rows[0].agencyId,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to load user', details: e?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
