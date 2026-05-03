import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { isEmailTrackingTokenAuthorized } from '@/lib/server/email-tracking-auth';
import {
  deleteAllEmailTrackingData,
  getEmailTrackingDashboard,
} from '@/lib/server/services/email-tracking-service';

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  if (!isEmailTrackingTokenAuthorized(request.headers)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const dashboard = await getEmailTrackingDashboard();
    return NextResponse.json({ ok: true, ...dashboard });
  } catch (error) {
    console.error('[email-tracking] dashboard failed', error);
    return NextResponse.json(
      { error: 'TRACKING_DASHBOARD_FAILED' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  if (!isEmailTrackingTokenAuthorized(request.headers)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await deleteAllEmailTrackingData();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[email-tracking] delete failed', error);
    return NextResponse.json(
      { error: 'TRACKING_DELETE_FAILED' },
      { status: 500 },
    );
  }
}
