import { clerkClient } from '@clerk/nextjs/server';
import { getAgencyIdFromClerkOrgId } from '@/lib/server/repositories/agency-repository';
import {
  createAgencyUser,
  deleteScopedUser,
  getScopedUserRole,
  listAgencyStudentsForExport,
  listAgencyUsersForOrg,
  type OrgManagedRole,
  updateScopedUserRole,
} from '@/lib/server/repositories/org-user-management-repository';

export async function resolveAgencyIdForOrg(orgId: string) {
  return getAgencyIdFromClerkOrgId(orgId);
}

export async function listAgencyUsersWithEmails(params: {
  agencyId: string;
  role?: OrgManagedRole | null;
}) {
  const rows = await listAgencyUsersForOrg(params);
  return attachEmails(rows);
}

async function attachEmails<TRow extends { clerkUserId: string | null | undefined }>(
  rows: TRow[],
) {

  const clerkIds = Array.from(
    new Set(
      rows
        .map((row) => row.clerkUserId as string | null)
        .filter((id): id is string => !!id)
    )
  );

  const emailByClerkId: Record<string, string | null> = {};

  if (clerkIds.length > 0) {
    const clerk = await clerkClient();
    const clerkUsers = await clerk.users.getUserList({
      userId: clerkIds,
      limit: clerkIds.length,
    });

    for (const user of clerkUsers.data) {
      const primary =
        user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        null;

      emailByClerkId[user.id] = primary;
    }
  }

  return rows.map((row) => ({
    ...row,
    email: row.clerkUserId ? emailByClerkId[row.clerkUserId] ?? null : null,
  }));
}

export async function listAgencyStudentsExportWithEmails(params: {
  agencyId: string;
}) {
  const rows = await listAgencyStudentsForExport(params);
  return attachEmails(rows);
}

export async function buildAgencyUserCreateInput(params: {
  name: string;
  role: OrgManagedRole;
  plannedMinutesInput: unknown;
  remainingMinutesInput: unknown;
}) {
  const name = params.name.trim();
  const role = params.role;

  let plannedMinutes = Number.isFinite(Number(params.plannedMinutesInput))
    ? Math.max(0, Math.trunc(Number(params.plannedMinutesInput)))
    : 0;

  let remainingMinutes = Number.isFinite(Number(params.remainingMinutesInput))
    ? Math.max(0, Math.trunc(Number(params.remainingMinutesInput)))
    : plannedMinutes;

  if (role !== 'student') {
    plannedMinutes = 0;
    remainingMinutes = 0;
  }

  return {
    name,
    role,
    plannedMinutes,
    remainingMinutes,
  };
}

export async function createManagedAgencyUser(params: {
  agencyId: string;
  name: string;
  role: OrgManagedRole;
  plannedMinutes: number;
  remainingMinutes: number;
}) {
  return createAgencyUser(params);
}

export async function authorizeScopedUserDeletion(params: {
  orgId: string;
  actorUserId: string;
  targetUserId: string;
}) {
  const actorRole = (await getScopedUserRole(
    params.orgId,
    params.actorUserId
  )) as OrgManagedRole | null;
  const meRole = actorRole ?? 'student';

  if (meRole !== 'instructor' && meRole !== 'admin') {
    return { ok: false as const, status: 403, body: { error: 'Forbidden' } };
  }

  if (params.targetUserId === params.actorUserId) {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'Cannot delete self' },
    };
  }

  const targetRole = (await getScopedUserRole(
    params.orgId,
    params.targetUserId
  )) as OrgManagedRole | null;

  if (!targetRole) {
    return { ok: false as const, status: 404, body: { error: 'Not found' } };
  }

  if (meRole === 'instructor' && targetRole !== 'student') {
    return { ok: false as const, status: 403, body: { error: 'Forbidden' } };
  }

  return { ok: true as const };
}

export async function deleteManagedScopedUser(params: {
  orgId: string;
  userId: string;
}) {
  await deleteScopedUser(params.orgId, params.userId);
}

export async function authorizeScopedRoleChange(params: {
  orgId: string;
  actorUserId: string;
  targetUserId: string;
  role: OrgManagedRole;
}) {
  if (params.targetUserId === params.actorUserId) {
    return {
      ok: false as const,
      status: 400,
      body: { error: 'Cannot change own role' },
    };
  }

  const actorRole = (await getScopedUserRole(
    params.orgId,
    params.actorUserId
  )) as OrgManagedRole | null;
  const meRole = actorRole ?? 'student';

  const targetRole = (await getScopedUserRole(
    params.orgId,
    params.targetUserId
  )) as OrgManagedRole | null;

  if (!targetRole) {
    return { ok: false as const, status: 404, body: { error: 'Not found' } };
  }

  if (meRole === 'instructor') {
    const allowed =
      (targetRole === 'student' && params.role === 'instructor') ||
      (targetRole === 'instructor' && params.role === 'student');

    if (!allowed) {
      return { ok: false as const, status: 403, body: { error: 'Forbidden' } };
    }
  } else if (meRole !== 'admin') {
    return { ok: false as const, status: 403, body: { error: 'Forbidden' } };
  }

  if (targetRole === 'admin' && meRole !== 'admin') {
    return { ok: false as const, status: 403, body: { error: 'Forbidden' } };
  }

  return { ok: true as const };
}

export async function changeManagedScopedUserRole(params: {
  orgId: string;
  userId: string;
  role: OrgManagedRole;
}) {
  return updateScopedUserRole(params);
}
