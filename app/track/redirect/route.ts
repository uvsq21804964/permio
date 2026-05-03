import { NextResponse } from 'next/server';

import { recordTrackedEmailClick } from '@/lib/server/services/email-tracking-service';

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return request.headers.get('x-real-ip');
}

function decodeTargetUrl(rawValue: string | null, requestUrl: URL) {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [trimmed];

  try {
    candidates.unshift(Buffer.from(trimmed, 'base64url').toString('utf8'));
  } catch {}

  for (const candidate of candidates) {
    try {
      const url = new URL(candidate, requestUrl);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        continue;
      }

      return url;
    } catch {}
  }

  return null;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const trackingId = requestUrl.searchParams.get('id')?.trim();
  const targetUrl = decodeTargetUrl(requestUrl.searchParams.get('to'), requestUrl);

  if (!targetUrl) {
    return NextResponse.json({ error: 'INVALID_TARGET_URL' }, { status: 400 });
  }

  if (trackingId) {
    try {
      await recordTrackedEmailClick({
        trackingId,
        targetUrl: targetUrl.toString(),
        ipAddress: getClientIp(request),
        userAgent: request.headers.get('user-agent'),
      });
    } catch (error) {
      console.error('[email-tracking] redirect tracking failed', error);
    }
  }

  return NextResponse.redirect(targetUrl, 302);
}
