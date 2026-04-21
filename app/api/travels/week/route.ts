// app/api/travels/week/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import type { Travel } from '@/types/availability';
import { requireUser } from '@/lib/api/auth-server';

type TravelRow = {
  id: string;
  dogsitterUserId: string;
  clientUserId: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeRangeLabel: string | null;

  client_formatted_address: string | null;
  client_lat: number | null;
  client_lng: number | null;
  client_street: string | null;
  client_street_number: string | null;
  client_postal_code: string | null;
  client_city: string | null;
  client_country: string | null;
  client_country_code: string | null;
  client_google_place_id: string | null;
  client_raw_input: string | null;
  client_address_label: string | null;
  client_is_primary: boolean;

  dogsitter_formatted_address: string | null;
  dogsitter_lat: number | null;
  dogsitter_lng: number | null;
  dogsitter_street: string | null;
  dogsitter_street_number: string | null;
  dogsitter_postal_code: string | null;
  dogsitter_city: string | null;
  dogsitter_country: string | null;
  dogsitter_country_code: string | null;
  dogsitter_google_place_id: string | null;
  dogsitter_raw_input: string | null;
  dogsitter_address_label: string | null;
  dogsitter_is_primary: boolean;

  createdAt: string | Date;
  updatedAt: string | Date;
};

export async function GET(req: NextRequest) {
  const { auth, response } = requireUser(req);
  if (!auth) return response;
  const { userId } = auth;

  const url = new URL(req.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json(
      { error: 'Query params "from" and "to" (YYYY-MM-DD) are required.' },
      { status: 400 }
    );
  }

  try {
    const rows = await sql`
      SELECT
        "id",
        "dogsitterUserId",
        "clientUserId",
        "date",
        "startTime",
        "endTime",
        "durationMinutes",
        "timeRangeLabel",

        "client_formatted_address",
        "client_lat",
        "client_lng",
        "client_street",
        "client_street_number",
        "client_postal_code",
        "client_city",
        "client_country",
        "client_country_code",
        "client_google_place_id",
        "client_raw_input",
        "client_address_label",
        "client_is_primary",

        "dogsitter_formatted_address",
        "dogsitter_lat",
        "dogsitter_lng",
        "dogsitter_street",
        "dogsitter_street_number",
        "dogsitter_postal_code",
        "dogsitter_city",
        "dogsitter_country",
        "dogsitter_country_code",
        "dogsitter_google_place_id",
        "dogsitter_raw_input",
        "dogsitter_address_label",
        "dogsitter_is_primary",

        "createdAt",
        "updatedAt"
      FROM "Travel"
      WHERE "date" BETWEEN ${from}::date AND ${to}::date
        AND (
          "dogsitterUserId" = ${userId}
          OR "clientUserId" = ${userId}
        )
      ORDER BY "date" ASC, "startTime" ASC
    `;

    function formatDateLocal(d: Date): string {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const travels = rows.map((r) => ({
      ...r,
      date: typeof r.date === 'string' ? r.date : formatDateLocal(r.date), // ✅ plus de shift de timezone

      createdAt:
        r.createdAt instanceof Date
          ? r.createdAt.toISOString()
          : (r.createdAt as string),

      updatedAt:
        r.updatedAt instanceof Date
          ? r.updatedAt.toISOString()
          : (r.updatedAt as string),
    }));

    // Compatible avec ton front : Travel[] (et non { data: Travel[] })
    return NextResponse.json(travels, { status: 200 });
  } catch (err) {
    console.error('Error fetching travels for week', err);
    return NextResponse.json(
      { error: 'Impossible de récupérer les trajets pour cette semaine.' },
      { status: 500 }
    );
  }
}
