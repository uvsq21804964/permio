'use client';

import { useCallback, useState } from 'react';

import { commitSchedule } from '@/lib/client/api/schedule-client';

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useCommitSchedule(options?: {
  orgId?: string;
  errorMessage?: string;
}) {
  const orgId = options?.orgId;
  const errorMessage = options?.errorMessage ?? 'Failed to commit schedule';

  const [loading, setLoading] = useState(false);

  const saveSchedule = useCallback(
    async (payload: {
      matches: Array<{
        studentId: string;
        studentName: string;
        instructorId: string;
        instructorName: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        duration: number;
      }>;
      scope?: string;
      weekStart?: string;
    }) => {
      try {
        setLoading(true);
        await commitSchedule(payload, {
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
    saveSchedule,
  };
}
