// app/api/users/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

type Role = 'student' | 'instructor' | 'admin';

// Mappe Clerk orgId -> Agency."Id"
async function getAgencyIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT "id"
    FROM "Agency"
    WHERE "clerk_org_id" = ${clerkOrgId}
    LIMIT 1
  `;
  return rows.length ? rows[0].id : null;
}

export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = getAuth(request, {
      treatPendingAsSignedOut: false,
    });
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized (no userId)' },
        { status: 401 }
      );
    }
    if (!orgId) {
      return NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      );
    }

    // IMPORTANT : on convertit le clerk_org_id -> Agency."Id"
    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const roleParam = request.nextUrl.searchParams.get('role') as Role | null;

    const rows = roleParam
      ? await sql`
          SELECT u.id, u.name, u.role, u."createdAt", u."updatedAt", u."agencyId"
          FROM "User" u
          WHERE u."agencyId" = ${agencyId}
            AND u.role = ${roleParam}
          ORDER BY u.name ASC
        `
      : await sql`
          SELECT u.id, u.name, u.role, u."createdAt", u."updatedAt", u."agencyId"
          FROM "User" u
          WHERE u."agencyId" = ${agencyId}
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
    const { userId, orgId } = getAuth(request, {
      treatPendingAsSignedOut: false,
    });
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized (no userId)' },
        { status: 401 }
      );
    }
    if (!orgId) {
      return NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      );
    }

    // IMPORTANT : on convertit le clerk_org_id -> Agency."Id"
    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const name = (body?.name ?? '').toString().trim();
    const role = (body?.role ?? '').toString().trim() as Role;

    if (!name || !role) {
      return NextResponse.json(
        { error: 'Missing name or role' },
        { status: 400 }
      );
    }

    const rows = await sql`
      INSERT INTO "User" (id, name, role, "agencyId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${name}, ${role}, ${agencyId}, NOW(), NOW())
      RETURNING id, name, role, "agencyId", "createdAt", "updatedAt"
    `;

    return NextResponse.json(rows[0], { status: 201 });
  } catch (error) {
    console.error('[api/users] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
