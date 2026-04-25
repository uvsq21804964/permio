// app/api/me/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireUser } from '@/lib/api/auth-server';

export async function GET(req: NextRequest) {
  try {
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    const rows = await sql`
      SELECT
        u."id",
        u."name",
        u."role",
        u."agencyId",
        u."planned_minutes",
        u."remaining_minutes",
        u."last_validated_week_start",
        u."last_validated_at",
        u."createdAt",
        u."updatedAt",
        u."formatted_address",
        u."lat",
        u."lng",
        u."street",
        u."street_number",
        u."postal_code",
        u."city",
        u."country",
        u."country_code",
        u."phone_country_code",
        u."phone_number",
        u."google_place_id",
        u."raw_input",
        u."address_label",
        u."is_primary",

        -- ✅ NEW: code d'association (éducateur) depuis Agency
        a.join_code AS "joinCode",
        a.name AS "agencyName"
      FROM "User" u
      LEFT JOIN "Agency" a ON a.id = u."agencyId"
      WHERE u."id" = ${userId}
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
    const { auth, response } = requireUser(req, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

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
      phone_country_code,
      phone_number,
      lat,
      lng,
      google_place_id,
      raw_input,
      // ⚠️ si quelqu'un tente d'envoyer joinCode, on l'ignore (non modifiable)
      // joinCode,
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
        phone_country_code = ${phone_country_code},
        phone_number = ${phone_number},
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
        phone_country_code,
        phone_number,
        google_place_id,
        raw_input,
        address_label,
        is_primary
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // ✅ IMPORTANT : on renvoie aussi joinCode/joinName après PATCH (comme GET)
    // pour que le front garde la même shape sans refetch.
    const agencyRes = await sql`
      SELECT a.join_code AS "joinCode", a.name AS "agencyName"
      FROM "User" u
      LEFT JOIN "Agency" a ON a.id = u."agencyId"
      WHERE u."id" = ${userId}
      LIMIT 1
    `;

    return NextResponse.json(
      {
        ok: true,
        user: {
          ...updated[0],
          joinCode: agencyRes?.[0]?.joinCode ?? null,
          agencyName: agencyRes?.[0]?.agencyName ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[PATCH /api/me/profile] error:', err);
    return NextResponse.json(
      { error: 'Failed to update profile', detail: err?.message },
      { status: 500 }
    );
  }
}
