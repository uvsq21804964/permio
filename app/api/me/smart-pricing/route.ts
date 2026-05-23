import { NextRequest, NextResponse } from 'next/server';

import { requireUser } from '@/lib/api/auth-server';
import type { SmartPricingMode } from '@/lib/pricing/smartSlotPricing';
import { getUserById } from '@/lib/server/repositories/user-repository';
import { upsertSmartPricingSettingsRow } from '@/lib/server/repositories/smart-pricing-settings-repository';
import {
  getSmartPricingSettings,
  mergeSmartPricingParams,
} from '@/lib/server/pricing/getSmartPricingSettings';

type SmartPricingUpdatePayload = {
  enabled?: boolean;
  mode?: SmartPricingMode;
  trainerHourlyValueCents?: number;
  costPerKmCents?: number;
  passThroughRate?: number;
  maxDiscountPct?: number;
  maxSurchargePct?: number;
  roundToNearestCents?: number;
};

async function requireInstructorUserId(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    return { ok: false as const, status: 404, body: { error: 'USER_NOT_FOUND' } };
  }

  if (user.role !== 'instructor') {
    return {
      ok: false as const,
      status: 403,
      body: { error: 'FORBIDDEN_SMART_PRICING_SETTINGS' },
    };
  }

  return { ok: true as const, user };
}

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const access = await requireInstructorUserId(auth.userId);
    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const settings = await getSmartPricingSettings(auth.userId);
    return NextResponse.json({ settings }, { status: 200 });
  } catch (error: any) {
    console.error('[GET /api/me/smart-pricing] error:', error);
    return NextResponse.json(
      {
        error: 'FAILED_TO_LOAD_SMART_PRICING_SETTINGS',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;

    const access = await requireInstructorUserId(auth.userId);
    if (!access.ok) {
      return NextResponse.json(access.body, { status: access.status });
    }

    const body = (await req.json().catch(() => null)) as SmartPricingUpdatePayload | null;
    if (!body) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const current = await getSmartPricingSettings(auth.userId);
    const settings = mergeSmartPricingParams({
      ...current,
      enabled:
        typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
      mode: body.mode ?? current.mode,
      trainerHourlyValueCents:
        body.trainerHourlyValueCents ?? current.trainerHourlyValueCents,
      costPerKmCents: body.costPerKmCents ?? current.costPerKmCents,
      passThroughRate: body.passThroughRate ?? current.passThroughRate,
      maxDiscountPct: body.maxDiscountPct ?? current.maxDiscountPct,
      maxSurchargePct: body.maxSurchargePct ?? current.maxSurchargePct,
      roundToNearestCents:
        body.roundToNearestCents ?? current.roundToNearestCents,
      maxDiscountCents: current.maxDiscountCents,
      maxSurchargeCents: current.maxSurchargeCents,
      neutralZonePct: current.neutralZonePct,
      hideIfImpactAboveCents: current.hideIfImpactAboveCents,
      availableOnRequestIfImpactAboveCents:
        current.availableOnRequestIfImpactAboveCents,
      wasteFactor: current.wasteFactor,
      weights: current.weights,
      thresholds: current.thresholds,
    });

    await upsertSmartPricingSettingsRow({
      instructorUserId: auth.userId,
      settings,
    });

    return NextResponse.json({ ok: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error('[PATCH /api/me/smart-pricing] error:', error);
    return NextResponse.json(
      {
        error: 'FAILED_TO_UPDATE_SMART_PRICING_SETTINGS',
        detail: error?.message,
      },
      { status: 500 },
    );
  }
}
