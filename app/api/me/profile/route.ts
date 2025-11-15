// app/api/me/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await sql`
      SELECT
        "id",
        "name",
        "role",
        "agencyId",
        "planned_minutes",
        "remaining_minutes",
        "last_validated_week_start",
        "last_validated_at",
        "createdAt",
        "updatedAt",
        "formatted_address",
        "lat",
        "lng",
        "street",
        "street_number",
        "postal_code",
        "city",
        "country",
        "country_code",
        "google_place_id",
        "raw_input",
        "address_label",
        "is_primary"
      FROM "User"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/me/profile] error:', err);
    return NextResponse.json(
      { error: 'Failed to load profile', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const {
      name,
      planned_minutes,
      address_label,
      formatted_address,
      street,
      street_number,
      postal_code,
      city,
      country,
      country_code,
      lat,
      lng,
      google_place_id,
      raw_input,
    } = body;

    if (planned_minutes != null && planned_minutes < 0) {
      return NextResponse.json(
        { error: 'PLANNED_MINUTES_NEGATIVE' },
        { status: 400 }
      );
    }

    const updated = await sql`
      UPDATE "User"
      SET
        "name" = ${name},
        "planned_minutes" = ${planned_minutes},
        address_label = ${address_label},
        formatted_address = ${formatted_address},
        street = ${street},
        street_number = ${street_number},
        postal_code = ${postal_code},
        city = ${city},
        country = ${country},
        country_code = ${country_code},
        lat = ${lat},
        lng = ${lng},
        google_place_id = ${google_place_id},
        raw_input = ${raw_input},
        "updatedAt" = NOW()
      WHERE "id" = ${userId}
      RETURNING
        "id",
        "name",
        "role",
        "agencyId",
        "planned_minutes",
        "remaining_minutes",
        "last_validated_week_start",
        "last_validated_at",
        "createdAt",
        "updatedAt",
        formatted_address,
        lat,
        lng,
        street,
        street_number,
        postal_code,
        city,
        country,
        country_code,
        google_place_id,
        raw_input,
        address_label,
        is_primary
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: updated[0] }, { status: 200 });
  } catch (err: any) {
    console.error('[PATCH /api/me/profile] error:', err);
    return NextResponse.json(
      { error: 'Failed to update profile', detail: err?.message },
      { status: 500 }
    );
  }
}
