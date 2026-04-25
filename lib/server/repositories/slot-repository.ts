import { sql } from '@/lib/db';

export type SlotRecord = {
  id: number;
  dogsitterUserId: string;
  clientUserId: string;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
};

export type SlotCancellationDetails = {
  slotId: number | string;
  agencyId: string | null;
  agencyName: string | null;
  clientUserId: string;
  clientName: string | null;
  instructorUserId: string;
  instructorName: string | null;
  serviceId: number;
  serviceName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  formattedAddress: string | null;
};

export type SlotAddressSource = {
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

export type SlotReminderDetails = {
  slotId: number | string;
  clientUserId: string;
  agencyName: string | null;
  serviceName: string | null;
  instructorUserId: string;
  instructorName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  formattedAddress: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

export type ClientBookingExportRow = {
  slotId: number | string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  serviceName: string | null;
  servicePrice: string | null;
  instructorName: string | null;
  formattedAddress: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

export async function listSlotsForUser(userId: string): Promise<SlotRecord[]> {
  const rows = await sql`
    SELECT
      id,
      "dogsitterUserId",
      "clientUserId",
      "serviceId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      "durationMinutes"
    FROM "Slot"
    WHERE "clientUserId" = ${userId}
       OR "dogsitterUserId" = ${userId}
    ORDER BY "date", "startTime"
  `;

  return rows as SlotRecord[];
}

export async function insertSlot(params: {
  instructorUserId: string;
  clientUserId: string;
  serviceId: number;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  addressSource: SlotAddressSource;
}): Promise<SlotRecord> {
  const {
    instructorUserId,
    clientUserId,
    serviceId,
    date,
    startTime,
    endTime,
    durationMinutes,
    addressSource,
  } = params;

  const [created] = await sql`
    INSERT INTO "Slot" (
      "dogsitterUserId",
      "clientUserId",
      "serviceId",
      "date",
      "startTime",
      "endTime",
      "durationMinutes",
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
    )
    VALUES (
      ${instructorUserId},
      ${clientUserId},
      ${serviceId},
      ${date}::date,
      ${startTime},
      ${endTime},
      ${durationMinutes},
      ${addressSource.formatted_address},
      ${addressSource.lat},
      ${addressSource.lng},
      ${addressSource.street},
      ${addressSource.street_number},
      ${addressSource.postal_code},
      ${addressSource.city},
      ${addressSource.country},
      ${addressSource.country_code},
      ${addressSource.google_place_id},
      ${addressSource.raw_input},
      ${addressSource.address_label},
      ${addressSource.is_primary}
    )
    RETURNING
      id,
      "dogsitterUserId",
      "clientUserId",
      "serviceId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      "durationMinutes"
  `;

  return created as SlotRecord;
}

export async function getSlotReminderDetails(
  slotId: number | string,
): Promise<SlotReminderDetails | null> {
  const rows = await sql`
    SELECT
      s.id AS "slotId",
      s."clientUserId" AS "clientUserId",
      s."dogsitterUserId" AS "instructorUserId",
      s."date"::date::text AS "date",
      s."startTime" AS "startTime",
      s."endTime" AS "endTime",
      s.formatted_address AS "formattedAddress",
      s.postal_code AS "postalCode",
      s.city AS "city",
      s.country AS "country",
      sp."name" AS "serviceName",
      instructor."name" AS "instructorName",
      agency."name" AS "agencyName"
    FROM "Slot" s
    LEFT JOIN services_pricing sp
      ON sp.id = s."serviceId"
    LEFT JOIN "User" instructor
      ON instructor.id = s."dogsitterUserId"
    LEFT JOIN "Agency" agency
      ON agency.id = instructor."agencyId"
    WHERE s.id = ${slotId}
    LIMIT 1
  `;

  return (rows?.[0] ?? null) as SlotReminderDetails | null;
}

export async function listClientBookingExportRows(params: {
  agencyId: string;
  clientUserId: string;
}): Promise<ClientBookingExportRow[]> {
  const rows = await sql`
    SELECT
      s.id AS "slotId",
      s."date"::date::text AS "date",
      s."startTime" AS "startTime",
      s."endTime" AS "endTime",
      s."durationMinutes" AS "durationMinutes",
      sp."name" AS "serviceName",
      sp."price"::text AS "servicePrice",
      instructor."name" AS "instructorName",
      s.formatted_address AS "formattedAddress",
      s.postal_code AS "postalCode",
      s.city AS "city",
      s.country AS "country"
    FROM "Slot" s
    INNER JOIN "User" client
      ON client.id = s."clientUserId"
    INNER JOIN "User" instructor
      ON instructor.id = s."dogsitterUserId"
    LEFT JOIN services_pricing sp
      ON sp.id = s."serviceId"
    WHERE s."clientUserId" = ${params.clientUserId}
      AND client.role = 'student'
      AND client."agencyId" = ${params.agencyId}
      AND instructor."agencyId" = ${params.agencyId}
    ORDER BY s."date" DESC, s."startTime" DESC, s.id DESC
  `;

  return rows as ClientBookingExportRow[];
}

export async function getSlotCancellationDetails(
  slotId: number | string,
): Promise<SlotCancellationDetails | null> {
  const rows = await sql`
    SELECT
      s.id AS "slotId",
      instructor."agencyId" AS "agencyId",
      agency."name" AS "agencyName",
      s."clientUserId" AS "clientUserId",
      client."name" AS "clientName",
      s."dogsitterUserId" AS "instructorUserId",
      instructor."name" AS "instructorName",
      s."serviceId" AS "serviceId",
      sp."name" AS "serviceName",
      s."date"::date::text AS "date",
      s."startTime" AS "startTime",
      s."endTime" AS "endTime",
      s.formatted_address AS "formattedAddress"
    FROM "Slot" s
    INNER JOIN "User" client
      ON client.id = s."clientUserId"
    INNER JOIN "User" instructor
      ON instructor.id = s."dogsitterUserId"
    LEFT JOIN "Agency" agency
      ON agency.id = instructor."agencyId"
    LEFT JOIN services_pricing sp
      ON sp.id = s."serviceId"
    WHERE s.id = ${slotId}
    LIMIT 1
  `;

  return (rows?.[0] ?? null) as SlotCancellationDetails | null;
}

export async function deleteSlotForUser(params: {
  slotId: number | string;
  userId: string;
}): Promise<SlotRecord | null> {
  const rows = await sql`
    DELETE FROM "Slot"
    WHERE id = ${params.slotId}
      AND (
        "clientUserId" = ${params.userId}
        OR "dogsitterUserId" = ${params.userId}
      )
    RETURNING
      id,
      "dogsitterUserId",
      "clientUserId",
      "serviceId",
      "date"::date::text AS "date",
      "startTime",
      "endTime",
      "durationMinutes"
  `;

  return (rows?.[0] ?? null) as SlotRecord | null;
}
