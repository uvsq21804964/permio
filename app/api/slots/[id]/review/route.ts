import { type NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/api/auth-server';
import {
  getSlotReview,
  upsertSlotReview,
} from '@/lib/server/services/trainer-review-service';

function parseSlotId(rawId: string) {
  const trimmed = rawId.trim();
  return trimmed || null;
}

function normalizeComment(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, 2000) : null;
}

function normalizeRating(value: unknown) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return null;
}

export async function GET(
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

    const result = await getSlotReview({
      slotId,
      userId: auth.userId,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('[GET /api/slots/[id]/review] error:', error);
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}

export async function PUT(
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

    const body = await request.json().catch(() => null);
    const rating = normalizeRating(body?.rating);
    const comment = normalizeComment(body?.comment);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'INVALID_REVIEW_RATING' }, { status: 400 });
    }

    const result = await upsertSlotReview({
      slotId,
      userId: auth.userId,
      rating,
      comment,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error: any) {
    console.error('[PUT /api/slots/[id]/review] error:', error);
    return NextResponse.json(
      {
        error: 'UNEXPECTED_ERROR',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}
