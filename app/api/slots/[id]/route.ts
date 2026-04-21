import { type NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/api/auth-server';
import { cancelSlotBooking } from '@/lib/server/services/slot-cancellation-service';

function getLocaleFromRequest(request: NextRequest): 'fr' | 'en' {
  const header =
    request.headers.get('x-locale') ||
    request.headers.get('accept-language') ||
    'fr';

  return header.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

function parseSlotId(rawId: string) {
  const trimmed = rawId.trim();
  return trimmed || null;
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { auth, response } = requireUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const { id } = await context.params;
    const slotId = parseSlotId(id);

    if (!slotId) {
      return NextResponse.json({ error: 'INVALID_SLOT_ID' }, { status: 400 });
    }

    const result = await cancelSlotBooking({
      userId: auth.userId,
      slotId,
      locale: getLocaleFromRequest(request),
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('[DELETE /api/slots/[id]] error:', error);
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}
