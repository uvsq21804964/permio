'use client';

import { useCallback, useState } from 'react';

import {
  incrementAgencyStudentHours,
  setAgencyStudentHours,
} from '@/lib/client/api/users-client';

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useStudentHoursMutations(options?: {
  orgId?: string;
  errorMessage?: string;
}) {
  const orgId = options?.orgId;
  const errorMessage = options?.errorMessage ?? 'Failed to update hours';

  const [loading, setLoading] = useState(false);

  const addHours = useCallback(
    async (userId: string, deltaMinutes: number) => {
      try {
        setLoading(true);
        await incrementAgencyStudentHours(userId, deltaMinutes, {
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

  const setHours = useCallback(
    async (
      userId: string,
      payload: { plannedMinutes: number; remainingMinutes: number },
    ) => {
      try {
        setLoading(true);
        await setAgencyStudentHours(userId, payload, {
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
    addHours,
    setHours,
  };
}
