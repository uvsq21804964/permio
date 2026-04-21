import { sql } from '@/lib/db';

export type AgencyRecord = {
  id: string;
  name: string | null;
  clerk_org_id: string | null;
  join_code: string | null;
};

export async function getAgencyIdFromClerkOrgId(
  clerkOrgId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT "id"
    FROM "Agency"
    WHERE "clerk_org_id" = ${clerkOrgId}
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0].id as string) : null;
}

export async function getAgencyById(
  agencyId: string
): Promise<AgencyRecord | null> {
  const rows = await sql`
    SELECT id, name, clerk_org_id, join_code
    FROM "Agency"
    WHERE id = ${agencyId}
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as AgencyRecord) : null;
}

export async function getAgencyByJoinCode(
  joinCode: string
): Promise<AgencyRecord | null> {
  const normalizedJoinCode = joinCode.trim().toUpperCase();

  const rows = await sql`
    SELECT id, name, clerk_org_id, join_code
    FROM "Agency"
    WHERE UPPER(join_code) = ${normalizedJoinCode}
    LIMIT 1
  `;

  return rows.length > 0 ? (rows[0] as AgencyRecord) : null;
}
