import { requestJson } from '@/lib/client/api/request';

export type ManagedRole = 'student' | 'instructor' | 'admin';

export type AgencyUser = {
  id: string;
  name: string | null;
  role: ManagedRole;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
  plannedMinutes?: number;
  remainingMinutes?: number;
};

type UsersErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

function buildHeaders(orgId?: string): HeadersInit | undefined {
  if (!orgId) {
    return undefined;
  }

  return {
    'x-org-id': orgId,
  };
}

export function getAgencyUsers(options?: {
  orgId?: string;
  role?: ManagedRole;
  fallbackMessage?: string;
}) {
  const params = new URLSearchParams();
  if (options?.role) {
    params.set('role', options.role);
  }

  const suffix = params.toString();
  const url = suffix ? `/api/users?${suffix}` : '/api/users';

  return requestJson<AgencyUser[], UsersErrorBody>(url, {
    credentials: 'include',
    headers: buildHeaders(options?.orgId),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to fetch users',
  });
}

export function updateAgencyUserRole(
  userId: string,
  role: ManagedRole,
  options?: { orgId?: string; fallbackMessage?: string },
) {
  return requestJson<{ ok: true }, UsersErrorBody>(`/api/users/${userId}/role`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.orgId),
    },
    body: JSON.stringify({ role }),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to update role',
  });
}

export function deleteAgencyUser(
  userId: string,
  options?: { orgId?: string; fallbackMessage?: string },
) {
  return requestJson<unknown, UsersErrorBody>(`/api/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: buildHeaders(options?.orgId),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to delete user',
  });
}

export function incrementAgencyStudentHours(
  userId: string,
  deltaMinutes: number,
  options?: { orgId?: string; fallbackMessage?: string },
) {
  return requestJson<unknown, UsersErrorBody>(`/api/users/${userId}/hours`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.orgId),
    },
    body: JSON.stringify({ deltaMinutes }),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to update hours',
  });
}

export function setAgencyStudentHours(
  userId: string,
  payload: { plannedMinutes: number; remainingMinutes: number },
  options?: { orgId?: string; fallbackMessage?: string },
) {
  return requestJson<unknown, UsersErrorBody>(`/api/users/${userId}/hours`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.orgId),
    },
    body: JSON.stringify(payload),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to set hours',
  });
}
