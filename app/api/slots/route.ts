import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/api/auth-server';
import { listSlotsForUser } from '@/lib/server/repositories/slot-repository';
import {
  createSlotBooking,
  type CreateSlotInput,
} from '@/lib/server/services/slot-booking-service';

function getLocaleFromRequest(request: NextRequest): 'fr' | 'en' {
  const header =
    request.headers.get('x-locale') ||
    request.headers.get('accept-language') ||
    'fr';

  return header.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const slots = await listSlotsForUser(auth.userId);
    return NextResponse.json(slots, { status: 200 });
  } catch (error) {
    console.error('[GET /api/slots] Error fetching slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch slots' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { auth, response } = requireUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    let body: CreateSlotInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'INVALID_JSON_BODY' }, { status: 400 });
    }

    const result = await createSlotBooking({
      userId: auth.userId,
      input: body,
      locale: body.locale || getLocaleFromRequest(request),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('[POST /api/slots] error:', error);
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}
