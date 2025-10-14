// app/api/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!orgId)
      return NextResponse.json(
        { error: 'No active organization' },
        { status: 403 }
      );

    const role = request.nextUrl.searchParams.get('role');

    const rows = role
      ? await sql`
        SELECT u.id, u.name, u.role, u."createdAt", u."updatedAt"
        FROM "User" u
        CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _cfg
        WHERE u.role = ${role}
        ORDER BY u.name ASC
      `
      : await sql`
        SELECT u.id, u.name, u.role, u."createdAt", u."updatedAt"
        FROM "User" u
        CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _cfg
        ORDER BY u.name ASC
      `;

    return NextResponse.json(rows);
  } catch (error) {
    console.error('[api/users] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!orgId)
      return NextResponse.json(
        { error: 'No active organization' },
        { status: 403 }
      );

    const { name, role } = await request.json();

    const [row] = await sql`
    WITH _cfg AS (SELECT set_config('app.agency_id', ${orgId}, true))
    INSERT INTO "User" (id, name, role, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), ${name}, ${role}, NOW(), NOW())
    RETURNING id, name, role, "createdAt", "updatedAt"
  `;
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('[api/users] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
