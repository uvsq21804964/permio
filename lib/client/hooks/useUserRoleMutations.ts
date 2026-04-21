'use client';

import { useCallback, useState } from 'react';

import {
  updateAgencyUserRole,
  type ManagedRole,
} from '@/lib/client/api/users-client';

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useUserRoleMutations(options?: {
  orgId?: string;
  errorMessage?: string;
}) {
  const orgId = options?.orgId;
  const errorMessage = options?.errorMessage ?? 'Failed to update role';

  const [loading, setLoading] = useState(false);

  const updateRole = useCallback(
    async (userId: string, role: ManagedRole) => {
      try {
        setLoading(true);
        await updateAgencyUserRole(userId, role, {
          orgId,
          fallbackMessage: errorMessage,
        });
      } catch (nextError) {
        throw new Error(toErrorMessage(nextError, errorMessage));
      } finally {
        setLoading(false);
      }
    },
    [errorMessage, orgId],
  );

  return {
    loading,
    updateRole,
  };
}
