// app/api/slots/week/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to' }, { status: 400 });
  }

  const rows = await sql/* sql */ `
    SELECT
      s.id,
      s."dogsitterUserId",
      s."clientUserId",
      s."serviceId",
      to_char(s.date, 'YYYY-MM-DD') AS date,
      s."startTime",
      s."endTime",
      s."durationMinutes",
      s."timeRangeLabel",
      s.formatted_address,
      s.lat,
      s.lng,
      s.street,
      s.street_number,
      s.postal_code,
      s.city,
      s.country,
      s.country_code,
      s.google_place_id,
      s.raw_input,
      s.address_label,

      -- 🔵 nom du client (User.name)
      u_client.name     AS "clientName",

      -- 🔵 nom du dogsitter (User.name)
      u_dogsitter.name  AS "dogsitterName",

      -- 🔵 libellé du service
      sp.name           AS "serviceName",

      -- 💰 prix du service
      sp.price          AS "servicePrice"
    FROM "Slot" s
    LEFT JOIN "User" u_client
      ON u_client.id = s."clientUserId"
    LEFT JOIN "User" u_dogsitter
      ON u_dogsitter.id = s."dogsitterUserId"
    LEFT JOIN services_pricing sp
      ON sp.id = s."serviceId"
    WHERE s.date BETWEEN ${from}::date AND ${to}::date
    ORDER BY s.date, s."startTime"
  `;

  return NextResponse.json(rows);
}
