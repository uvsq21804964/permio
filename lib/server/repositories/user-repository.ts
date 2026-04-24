import { sql } from '@/lib/db';

export type AppUserRecord = {
  id: string;
  name: string | null;
  role: string;
  agencyId: string | null;
  planned_minutes?: number | null;
  remaining_minutes?: number | null;
  formatted_address?: string | null;
  lat?: number | null;
  lng?: number | null;
  street?: string | null;
  street_number?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  country_code?: string | null;
  google_place_id?: string | null;
  raw_input?: string | null;
  address_label?: string | null;
  is_primary?: boolean | null;
};

export async function getUserById(userId: string): Promise<AppUserRecord | null> {
  const rows = await sql`
    SELECT
      id,
      name,
      role,
      "agencyId",
      planned_minutes,
      remaining_minutes,
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
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as AppUserRecord) : null;
}

export async function getAgencyUsers(agencyId: string): Promise<AppUserRecord[]> {
  const rows = await sql`
    SELECT
      id,
      name,
      role,
      "agencyId",
      planned_minutes,
      remaining_minutes
    FROM "User"
    WHERE "agencyId" = ${agencyId}
    ORDER BY name ASC NULLS LAST
  `;

  return rows as AppUserRecord[];
}

export async function getFirstAgencyInstructor(
  agencyId: string
): Promise<AppUserRecord | null> {
  const rows = await sql`
    SELECT
      id,
      name,
      role,
      "agencyId",
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
    FROM "User"
    WHERE "agencyId" = ${agencyId}
      AND role = 'instructor'
    ORDER BY "createdAt" ASC NULLS LAST, name ASC NULLS LAST
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as AppUserRecord) : null;
}

export async function getStudentHours(
  userId: string
): Promise<Pick<AppUserRecord, 'id' | 'role' | 'agencyId' | 'planned_minutes' | 'remaining_minutes'> | null> {
  const rows = await sql`
    SELECT
      id,
      role,
      "agencyId",
      planned_minutes,
      remaining_minutes
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0
    ? (rows[0] as Pick<
        AppUserRecord,
        'id' | 'role' | 'agencyId' | 'planned_minutes' | 'remaining_minutes'
      >)
    : null;
}
