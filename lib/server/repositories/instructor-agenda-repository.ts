import { sql } from '@/lib/db';

export type InstructorAgendaKind = 'available' | 'unavailable';

export type InstructorAgendaDefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type InstructorAgendaDayException = {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  kind: InstructorAgendaKind;
};

export type InstructorAgendaBookedSlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  clientUserId: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  google_place_id: string | null;
  raw_input: string | null;
  address_label: string | null;
};

export type InstructorAgendaUserRow = {
  id: string;
  name: string | null;
  role: string;
  agencyId: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  google_place_id: string | null;
  raw_input: string | null;
  address_label: string | null;
  is_primary: boolean;
};

export async function getAgendaUserById(
  userId: string
): Promise<InstructorAgendaUserRow | null> {
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
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as InstructorAgendaUserRow) : null;
}

export async function getFirstAgencyInstructorForAgenda(
  agencyId: string
): Promise<InstructorAgendaUserRow | null> {
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
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as InstructorAgendaUserRow) : null;
}

export async function listInstructorDefaultAvailabilities(
  instructorId: string
): Promise<InstructorAgendaDefaultAvailability[]> {
  const rows = await sql`
    SELECT id, "userId", "dayOfWeek", "startTime", "endTime"
    FROM "Availability"
    WHERE "userId" = ${instructorId}
    ORDER BY "dayOfWeek", "startTime"
  `;

  return rows as InstructorAgendaDefaultAvailability[];
}

export async function listInstructorDayExceptions(
  instructorId: string,
  startDate: string,
  endDate: string
): Promise<InstructorAgendaDayException[]> {
  const rows = await sql`
    SELECT
      id,
      "userId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      kind
    FROM "DayAvailability"
    WHERE "userId" = ${instructorId}
      AND "date" >= ${startDate}::date
      AND "date" <= ${endDate}::date
    ORDER BY "date", "startTime"
  `;

  return rows as InstructorAgendaDayException[];
}

export async function listInstructorBookedSlots(
  instructorId: string,
  startDate: string,
  endDate: string
): Promise<InstructorAgendaBookedSlot[]> {
  const rows = await sql`
    SELECT
      id,
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      "clientUserId",
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
      address_label
    FROM "Slot"
    WHERE "dogsitterUserId" = ${instructorId}
      AND "date" BETWEEN ${startDate}::date AND ${endDate}::date
    ORDER BY "date", "startTime"
  `;

  return rows as InstructorAgendaBookedSlot[];
}
