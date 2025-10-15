// app/api/me/role/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!orgId)
    return NextResponse.json(
      { error: 'No active organization' },
      { status: 403 }
    );

  // RLS/tenant context si tu l’utilises déjà via set_config(app.agency_id, …)
  const rows = await sql/* sql */ `
    WITH _cfg AS (SELECT set_config('app.agency_id', ${orgId}, true))
    SELECT u.id, u.name, u.role
    FROM "User" u
    WHERE
      -- cas 1 : tu utilises l'ID Clerk comme PK de "User"
      u.id = ${userId}
      
    ORDER BY (u.id = ${userId}) DESC
    LIMIT 1
  `;

  if (rows.length === 0) {
    return NextResponse.json(
      { error: 'User not found in app DB' },
      { status: 404 }
    );
  }

  const { id, name, role } = rows[0] as {
    id: string;
    name: string;
    role: string;
  };
  return NextResponse.json({ id, name, role });
}
