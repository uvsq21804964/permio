'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getAllAvailabilities,
  type AvailabilityRecord,
} from '@/lib/client/api/availabilities-client';

type UseAllAvailabilitiesOptions = {
  enabled?: boolean;
  loadErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useAllAvailabilities(
  options: UseAllAvailabilitiesOptions = {}
) {
  const {
    enabled = true,
    loadErrorMessage = 'Failed to fetch all availabilities',
  } = options;

  const [availabilities, setAvailabilities] = useState<AvailabilityRecord[]>([]);
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
      const data = await getAllAvailabilities({
        fallbackMessage: loadErrorMessage,
      });
      const list = Array.isArray(data)
        ? data
        : data?.availabilities ?? data?.data ?? [];
      setAvailabilities(list);
      return list;
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

  return {
    availabilities,
    loading,
    error,
    reload,
  };
}
