'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getAgencyUsers,
  type AgencyUser,
  type ManagedRole,
} from '@/lib/client/api/users-client';

type UseAgencyUsersOptions = {
  enabled?: boolean;
  orgId?: string;
  role?: ManagedRole;
  loadErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useAgencyUsers(options: UseAgencyUsersOptions = {}) {
  const {
    enabled = true,
    orgId,
    role,
    loadErrorMessage = 'Failed to fetch users',
  } = options;

  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      setError(null);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAgencyUsers({
        orgId,
        role,
        fallbackMessage: loadErrorMessage,
      });
      setUsers(data ?? []);
      return data ?? [];
    } catch (nextError) {
      const message = toErrorMessage(nextError, loadErrorMessage);
      setUsers([]);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, loadErrorMessage, orgId, role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    users,
    loading,
    error,
    reload,
  };
}
