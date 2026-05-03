import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { isEmailTrackingTokenAuthorized } from '@/lib/server/email-tracking-auth';
import { getButtonTrackingUserJourney } from '@/lib/server/services/button-tracking-service';

export async function GET(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 });
  }

  if (!isEmailTrackingTokenAuthorized(request.headers)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const selectedUserId = requestUrl.searchParams.get('userId')?.trim();

  if (!selectedUserId) {
    return NextResponse.json({ ok: true, journey: [] });
  }

  try {
    const journey = await getButtonTrackingUserJourney(selectedUserId);
    return NextResponse.json({ ok: true, journey });
  } catch (error) {
    console.error('[button-tracking] user journey failed', error);
    return NextResponse.json(
      { error: 'BUTTON_TRACKING_USER_JOURNEY_FAILED' },
      { status: 500 },
    );
  }
}
