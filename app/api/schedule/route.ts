// app/api/schedule/route.ts
import { runPythonScheduler } from '@/lib/scheduler';
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

// Mappe Clerk orgId -> Agency.id (minuscule)
async function getAgencyIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT "id"
    FROM "Agency"
    WHERE "clerk_org_id" = ${clerkOrgId}
    LIMIT 1
  `;
  console.log('clerkOrgId', clerkOrgId);
  return rows.length ? rows[0].id : null;
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

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const result = await runPythonScheduler(agencyId);
    console.log('[API /schedule] RESULT =', JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[schedule] error:', err);
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du planning',
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
