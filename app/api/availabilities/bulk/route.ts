import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  mergeWeeklyAvailabilities,
  WeeklyAvailabilityInput,
} from '@/lib/server/domain/time-ranges';
import { replaceUserAvailabilities } from '@/lib/server/repositories/availability-repository';

export async function POST(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) return response;
  const { userId } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const availabilities: WeeklyAvailabilityInput[] = Array.isArray(
    body?.availabilities
  )
    ? body.availabilities
    : [];
  const merged = mergeWeeklyAvailabilities(availabilities);

  await replaceUserAvailabilities(userId, merged);

  return NextResponse.json({ ok: true, count: merged.length });
}
