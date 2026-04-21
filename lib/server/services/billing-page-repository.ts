import { sql } from '@/lib/db';
import {
  toDate,
  type BillingUserContext,
  type DbInstructorRow,
  type DbMeRow,
} from '@/lib/server/services/billing-page-shared';

export async function loadBillingUserContext(
  userId: string,
): Promise<BillingUserContext | null> {
  const meDbRes = await sql`
    select
      role,
      "agencyId" as "agencyId",
      "createdAt" as "createdAt"
    from "User"
    where id = ${userId}
    limit 1
  `;

  const meDb = meDbRes[0] as DbMeRow | undefined;
  if (!meDb) return null;

  let instructorCreatedAt = toDate(meDb.createdAt);
  if (meDb.role !== 'instructor') {
    const instructorRes = await sql`
      select "createdAt" as "createdAt"
      from "User"
      where "agencyId" = ${meDb.agencyId}
        and role = 'instructor'
      order by "createdAt" asc
      limit 1
    `;
    const instructor = instructorRes[0] as DbInstructorRow | undefined;
    if (instructor?.createdAt) {
      instructorCreatedAt = toDate(instructor.createdAt);
    }
  }

  const trialRes = await sql`
    select
      (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end) as "trialStart",
      (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end + interval '1 month') as "trialEnd",
      (now() < (case
        when ${meDb.role} = 'instructor'
          then (select "createdAt" from "User" where id = ${userId} limit 1)
        else (select min("createdAt") from "User" where "agencyId" = ${meDb.agencyId} and role = 'instructor')
      end + interval '1 month')) as "isInTrial"
  `;

  return {
    meDb,
    instructorCreatedAt,
    trialRow: (trialRes?.[0] ?? {}) as any,
  };
}
