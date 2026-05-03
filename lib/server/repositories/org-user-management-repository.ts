import { sql } from '@/lib/db';

export type OrgManagedRole = 'student' | 'instructor' | 'admin';

export type OrgManagedUserListRow = {
  id: string;
  name: string | null;
  role: OrgManagedRole;
  createdAt: string;
  updatedAt: string;
  agencyId: string;
  clerkUserId: string;
  plannedMinutes: number | null;
  remainingMinutes: number | null;
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
};

export type OrgManagedStudentExportRow = {
  id: string;
  name: string | null;
  clerkUserId: string;
  createdAt: string;
  updatedAt: string;
  formattedAddress: string | null;
  street: string | null;
  streetNumber: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
};

export async function listAgencyUsersForOrg(params: {
  agencyId: string;
  role?: OrgManagedRole | null;
}): Promise<OrgManagedUserListRow[]> {
  const rows = params.role
    ? await sql`
        SELECT
          u.id,
          u.name,
          u.role,
          u."createdAt",
          u."updatedAt",
          u."agencyId",
          u.id AS "clerkUserId",
          CASE WHEN u.role = 'student' THEN u.planned_minutes ELSE NULL END AS "plannedMinutes",
          CASE WHEN u.role = 'student' THEN u.remaining_minutes ELSE NULL END AS "remainingMinutes",
          u.formatted_address,
          u.lat,
          u.lng,
          u.street,
          u.street_number,
          u.postal_code,
          u.city,
          u.country,
          u.country_code,
          u.google_place_id
        FROM "User" u
        WHERE u."agencyId" = ${params.agencyId}
          AND u.role = ${params.role}
        ORDER BY u.name ASC NULLS LAST
      `
    : await sql`
        SELECT
          u.id,
          u.name,
          u.role,
          u."createdAt",
          u."updatedAt",
          u."agencyId",
          u.id AS "clerkUserId",
          CASE WHEN u.role = 'student' THEN u.planned_minutes ELSE NULL END AS "plannedMinutes",
          CASE WHEN u.role = 'student' THEN u.remaining_minutes ELSE NULL END AS "remainingMinutes",
          u.formatted_address,
          u.lat,
          u.lng,
          u.street,
          u.street_number,
          u.postal_code,
          u.city,
          u.country,
          u.country_code,
          u.google_place_id
        FROM "User" u
        WHERE u."agencyId" = ${params.agencyId}
        ORDER BY u.name ASC NULLS LAST
      `;

  return rows as OrgManagedUserListRow[];
}

export async function listAgencyStudentsForExport(params: {
  agencyId: string;
}): Promise<OrgManagedStudentExportRow[]> {
  const rows = await sql`
    SELECT
      u.id,
      u.name,
      u.id AS "clerkUserId",
      u."createdAt"::text AS "createdAt",
      u."updatedAt"::text AS "updatedAt",
      u.formatted_address AS "formattedAddress",
      u.street AS "street",
      u.street_number AS "streetNumber",
      u.postal_code AS "postalCode",
      u.city AS "city",
      u.country AS "country"
    FROM "User" u
    WHERE u."agencyId" = ${params.agencyId}
      AND u.role = 'student'
    ORDER BY u.name ASC NULLS LAST, u."createdAt" ASC
  `;

  return rows as OrgManagedStudentExportRow[];
}

export async function createAgencyUser(params: {
  agencyId: string;
  name: string;
  role: OrgManagedRole;
  plannedMinutes: number;
  remainingMinutes: number;
}) {
  const rows =
    params.role === 'student'
      ? await sql`
          INSERT INTO "User" (
            id, name, role, "agencyId", "createdAt", "updatedAt",
            planned_minutes, remaining_minutes
          )
          VALUES (
            gen_random_uuid(), ${params.name}, ${params.role}, ${params.agencyId}, NOW(), NOW(),
            ${params.plannedMinutes}, ${params.remainingMinutes}
          )
          RETURNING
            id, name, role, "agencyId", "createdAt", "updatedAt",
            planned_minutes AS "plannedMinutes",
            remaining_minutes AS "remainingMinutes"
        `
      : await sql`
          INSERT INTO "User" (
            id, name, role, "agencyId", "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(), ${params.name}, ${params.role}, ${params.agencyId}, NOW(), NOW()
          )
          RETURNING id, name, role, "agencyId", "createdAt", "updatedAt",
            NULL::int AS "plannedMinutes",
            NULL::int AS "remainingMinutes"
        `;

  return rows[0];
}

export async function getScopedUserRole(orgId: string, userId: string) {
  const rows = await sql`
    SELECT u.role
    FROM "User" u
    CROSS JOIN LATERAL (SELECT set_config('app.agency_id', ${orgId}, true)) _
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  return rows[0]?.role ?? null;
}

export async function deleteScopedUser(orgId: string, userId: string) {
  await sql`
    WITH _cfg AS (SELECT set_config('app.agency_id', ${orgId}, true))
    DELETE FROM "User" WHERE id = ${userId}
  `;
}

export async function updateScopedUserRole(params: {
  orgId: string;
  userId: string;
  role: OrgManagedRole;
}) {
  const rows = await sql`
    WITH _cfg AS (SELECT set_config('app.agency_id', ${params.orgId}, true))
    UPDATE "User" SET role = ${params.role} WHERE id = ${params.userId}
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function incrementStudentHours(params: {
  userId: string;
  agencyId: string;
  deltaMinutes: number;
}) {
  const rows = await sql`
    UPDATE "User"
    SET
      planned_minutes = planned_minutes + ${params.deltaMinutes},
      remaining_minutes = remaining_minutes + ${params.deltaMinutes},
      "updatedAt" = NOW()
    WHERE id = ${params.userId} AND "agencyId" = ${params.agencyId} AND role = 'student'
    RETURNING
      id, name, role, "agencyId", "createdAt", "updatedAt",
      planned_minutes AS "plannedMinutes",
      remaining_minutes AS "remainingMinutes"
  `;

  return rows[0] ?? null;
}

export async function setStudentHours(params: {
  userId: string;
  agencyId: string;
  plannedMinutes: number;
  remainingMinutes: number;
}) {
  const rows = await sql`
    UPDATE "User"
    SET
      planned_minutes = ${params.plannedMinutes},
      remaining_minutes = ${params.remainingMinutes},
      "updatedAt" = NOW()
    WHERE id = ${params.userId} AND "agencyId" = ${params.agencyId} AND role = 'student'
    RETURNING
      id, name, role, "agencyId", "createdAt", "updatedAt",
      planned_minutes AS "plannedMinutes",
      remaining_minutes AS "remainingMinutes"
  `;

  return rows[0] ?? null;
}
