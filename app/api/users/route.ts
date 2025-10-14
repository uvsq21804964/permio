import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

const AGENCY_ID = 'agency-rennes';

export async function GET(request: NextRequest) {
  try {
    const role = request.nextUrl.searchParams.get('role');

    const users = role
      ? await sql`
          WITH _cfg AS (
            SELECT set_config('app.agency_id', ${AGENCY_ID}, true)
          )
          SELECT id, name, role, "createdAt", "updatedAt"
          FROM "User"
          WHERE role = ${role}
          ORDER BY name ASC
        `
      : await sql`
          WITH _cfg AS (
            SELECT set_config('app.agency_id', ${AGENCY_ID}, true)
          )
          SELECT id, name, role, "createdAt", "updatedAt"
          FROM "User"
          ORDER BY name ASC
        `;

    return NextResponse.json(users);
  } catch (error) {
    console.error('[v0] Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, role } = await request.json();

    const [user] = await sql`
      WITH _cfg AS (
        SELECT set_config('app.agency_id', ${AGENCY_ID}, true)
      )
      INSERT INTO "User" (id, name, role, "agencyId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${role},
              current_setting('app.agency_id', true), NOW(), NOW())
      RETURNING id, name, role, "createdAt", "updatedAt"
    `;

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('[v0] Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
