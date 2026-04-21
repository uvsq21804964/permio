// app/api/me/instructor-services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import { getInstructorServiceCatalogForViewer } from '@/lib/server/services/service-catalog-service';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const result = await getInstructorServiceCatalogForViewer(userId);
    if (!result.ok) {
      return NextResponse.json(result.body, { status: result.status });
    }

    return NextResponse.json(
      {
        instructorId: result.instructorId,
        categories: result.categories,
        services: result.services,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[GET /api/me/instructor-services] error:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch instructor services',
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}
