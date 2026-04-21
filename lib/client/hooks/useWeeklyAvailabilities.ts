'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  createWeeklyAvailability,
  deleteWeeklyAvailability,
  getWeeklyAvailabilities,
  type WeeklyAvailability,
} from '@/lib/client/api/availabilities-client';

type UseWeeklyAvailabilitiesOptions = {
  enabled?: boolean;
  loadErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useWeeklyAvailabilities(
  options: UseWeeklyAvailabilitiesOptions = {},
) {
  const {
    enabled = true,
    loadErrorMessage = 'Failed to fetch availabilities',
  } = options;

  const [availabilities, setAvailabilities] = useState<WeeklyAvailability[]>(
    [],
  );
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setAvailabilities([]);
      setError(null);
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getWeeklyAvailabilities({
        fallbackMessage: loadErrorMessage,
      });
      setAvailabilities(data ?? []);
      return data ?? [];
    } catch (nextError) {
      const message = toErrorMessage(nextError, loadErrorMessage);
      setAvailabilities([]);
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, loadErrorMessage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addAvailability = useCallback(
    async (payload: {
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) => {
      await createWeeklyAvailability(payload, {
        fallbackMessage: loadErrorMessage,
      });
      return reload();
    },
    [loadErrorMessage, reload],
  );

  const removeAvailability = useCallback(
    async (availabilityId: string) => {
      await deleteWeeklyAvailability(availabilityId, {
        fallbackMessage: loadErrorMessage,
      });
      return reload();
    },
    [loadErrorMessage, reload],
  );

  return {
    availabilities,
    loading,
    error,
    reload,
    addAvailability,
    removeAvailability,
  };
}
