import { sql } from '@/lib/db';

export async function requireAgencyByCode(codeRaw: string) {
  const code = String(codeRaw || '')
    .trim()
    .toUpperCase();
  if (!code) {
    const err: any = new Error('Missing agency code');
    err.status = 400;
    throw err;
  }

  const rows = await sql`
    SELECT id, name, join_code
    FROM "Agency"
    WHERE UPPER(join_code) = ${code}
    LIMIT 1
  `;
  const agency = rows?.[0];
  if (!agency?.id) {
    const err: any = new Error('Invalid agency code');
    err.status = 404;
    throw err;
  }
  return agency as { id: string; name: string; join_code: string };
}

export async function assertTrainerBelongsToAgency(
  trainerUserId: string,
  agencyId: string
) {
  const rows = await sql`
    SELECT id
    FROM "User"
    WHERE id = ${trainerUserId}
      AND "agencyId" = ${agencyId}
      AND role = ${'trainer'}
    LIMIT 1
  `;
  if (!rows?.length) {
    const err: any = new Error('Trainer not in this agency');
    err.status = 403;
    throw err;
  }
}
