import { NextResponse } from 'next/server';
import { isEmailTrackingTokenAuthorized } from '@/lib/server/email-tracking-auth';
import { registerTrackedEmail } from '@/lib/server/services/email-tracking-service';

type RegisterPayload = {
  trackingId?: string;
  recipientEmail?: string | null;
  firstName?: string | null;
  subject?: string | null;
  campaignLabel?: string | null;
  sentAt?: string | null;
};

export async function POST(request: Request) {
  if (!isEmailTrackingTokenAuthorized(request.headers)) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  let payload: RegisterPayload | null = null;

  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
  }

  const trackingId = payload?.trackingId?.trim();
  if (!trackingId) {
    return NextResponse.json(
      { error: 'TRACKING_ID_REQUIRED' },
      { status: 400 },
    );
  }

  try {
    const row = await registerTrackedEmail({
      trackingId,
      recipientEmail: payload?.recipientEmail,
      firstName: payload?.firstName,
      subject: payload?.subject,
      campaignLabel: payload?.campaignLabel,
      sentAtIso: payload?.sentAt,
    });

    return NextResponse.json({ ok: true, row });
  } catch (error) {
    console.error('[email-tracking] register failed', error);
    return NextResponse.json(
      { error: 'TRACKING_REGISTER_FAILED' },
      { status: 500 },
    );
  }
}
