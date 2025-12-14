import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

type AvailabilityPayload = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

const START_MIN = 8 * 60;
const END_MAX = 20 * 60;

function timeToMinutes(time: string): number {
  if (!/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function mergeAvailabilities(
  list: AvailabilityPayload[]
): AvailabilityPayload[] {
  const byDay = new Map<number, { s: number; e: number }[]>();

  for (const a of list) {
    const s = timeToMinutes(a.startTime);
    const e = timeToMinutes(a.endTime);
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    const arr = byDay.get(a.dayOfWeek) ?? [];
    arr.push({ s, e });
    byDay.set(a.dayOfWeek, arr);
  }

  const out: AvailabilityPayload[] = [];
  for (const [day, ranges] of byDay.entries()) {
    const sorted = [...ranges].sort((a, b) => a.s - b.s || a.e - b.e);
    const merged: { s: number; e: number }[] = [];

    for (const r of sorted) {
      if (merged.length === 0) {
        merged.push({ ...r });
        continue;
      }
      const last = merged[merged.length - 1];
      if (r.s <= last.e) last.e = Math.max(last.e, r.e);
      else merged.push({ ...r });
    }

    for (const r of merged) {
      out.push({
        dayOfWeek: day,
        startTime: minutesToTime(r.s),
        endTime: minutesToTime(r.e),
      });
    }
  }

  return out.sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
}

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const availabilities: AvailabilityPayload[] = Array.isArray(
    body?.availabilities
  )
    ? body.availabilities
    : [];

  const cleaned: AvailabilityPayload[] = [];
  for (const a of availabilities) {
    const day = Number(a?.dayOfWeek);
    const s = timeToMinutes(String(a?.startTime || ''));
    const e = timeToMinutes(String(a?.endTime || ''));
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    if (e <= s) continue;
    if (s < START_MIN || e > END_MAX) continue;

    cleaned.push({
      dayOfWeek: day,
      startTime: minutesToTime(s),
      endTime: minutesToTime(e),
    });
  }

  const merged = mergeAvailabilities(cleaned);

  await sql`DELETE FROM "Availability" WHERE "userId" = ${userId}`;
  for (const a of merged) {
    await sql`
      INSERT INTO "Availability" (
        "userId", "dayOfWeek", "startTime", "endTime", "createdAt", "updatedAt"
      ) VALUES (
        ${userId}, ${a.dayOfWeek}, ${a.startTime}, ${a.endTime}, NOW(), NOW()
      )
    `;
  }

  return NextResponse.json({ ok: true, count: merged.length });
}
