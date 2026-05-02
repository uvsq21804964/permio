import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { recordTrackedEmailOpen } from '@/lib/server/services/email-tracking-service';

const PIXEL_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

function buildPixelResponse() {
  const buffer = Buffer.from(PIXEL_BASE64, 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

async function buildSignatureImageResponse() {
  const buffer = await readFile(path.join(process.cwd(), 'public', 'Icone.png'));

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }

  return request.headers.get('x-real-ip');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get('id')?.trim();
  const asset = searchParams.get('asset')?.trim();

  if (!trackingId) {
    return buildPixelResponse();
  }

  try {
    await recordTrackedEmailOpen({
      trackingId,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    console.error('[email-tracking] open tracking failed', error);
  }

  if (asset === 'signature') {
    try {
      return await buildSignatureImageResponse();
    } catch (error) {
      console.error('[email-tracking] signature image failed', error);
    }
  }

  return buildPixelResponse();
}
