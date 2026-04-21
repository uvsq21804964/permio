// app/api/schedule/route.ts
import { runPythonScheduler } from '@/lib/scheduler';
import { type NextRequest, NextResponse } from 'next/server';
import { requireOrgUser } from '@/lib/api/auth-server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';
import { devLogger } from '@/lib/shared/dev-logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = requireOrgUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { orgId } = auth;

    const agencyId = await getAgencyIdFromClerkOrgId(orgId);
    if (!agencyId) {
      return NextResponse.json(
        { error: `Agency not found for clerk_org_id=${orgId}` },
        { status: 404 }
      );
    }

    const result = await runPythonScheduler(agencyId);
    devLogger.log('[API /schedule] RESULT', result);
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
