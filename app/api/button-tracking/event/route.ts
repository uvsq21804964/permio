import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { recordTrackedButtonClick } from '@/lib/server/services/button-tracking-service';

type ButtonTrackingEventBody = {
  buttonKey?: string;
  buttonLabel?: string | null;
  buttonContext?: string | null;
  durationMs?: number | null;
  eventType?: 'button_click' | 'page_view' | 'page_leave';
  pagePath?: string | null;
  targetHref?: string | null;
  locale?: string | null;
  metadata?: Record<string, unknown> | null;
  referrer?: string | null;
};

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return request.headers.get('x-real-ip');
}

export async function POST(request: Request) {
  let payload: ButtonTrackingEventBody | null = null;

  try {
    payload = (await request.json()) as ButtonTrackingEventBody;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const { userId, sessionId } = await auth();

  if (!payload?.buttonKey?.trim()) {
    return NextResponse.json({ error: 'BUTTON_KEY_REQUIRED' }, { status: 400 });
  }

  try {
    await recordTrackedButtonClick({
      buttonKey: payload.buttonKey,
      buttonLabel: payload.buttonLabel,
      buttonContext: payload.buttonContext,
      durationMs: payload.durationMs,
      eventType: payload.eventType,
      pagePath: payload.pagePath,
      targetHref: payload.targetHref,
      locale: payload.locale,
      metadata: payload.metadata,
      referrer: payload.referrer,
      userId,
      sessionId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[button-tracking] event failed', error);
    return NextResponse.json({ error: 'BUTTON_TRACKING_FAILED' }, { status: 500 });
  }
}
