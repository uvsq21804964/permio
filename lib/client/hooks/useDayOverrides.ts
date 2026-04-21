'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  createDayAvailability,
  deleteDayAvailability,
  getDayAvailabilities,
} from '@/lib/client/api/availabilities-client';
import type { DayAvailability, Kind } from '@/types/availability';

type UseDayOverridesOptions = {
  date: string;
  loadDayErrorMessage?: string;
  loadUpcomingErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useDayOverrides(options: UseDayOverridesOptions) {
  const {
    date,
    loadDayErrorMessage = 'Failed to fetch day availabilities',
    loadUpcomingErrorMessage = 'Failed to fetch upcoming day availabilities',
  } = options;

  const [entries, setEntries] = useState<DayAvailability[]>([]);
  const [upcomingEntries, setUpcomingEntries] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(
    async (targetDate: string) => {
      if (!targetDate) {
        setEntries([]);
        return [];
      }

      try {
        setLoading(true);
        setError(null);
        const data = await getDayAvailabilities(
          { date: targetDate },
          { fallbackMessage: loadDayErrorMessage },
        );
        setEntries(data);
        return data;
      } catch (nextError) {
        const message = toErrorMessage(nextError, loadDayErrorMessage);
        setEntries([]);
        setError(message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [loadDayErrorMessage],
  );

  const loadUpcoming = useCallback(async () => {
    try {
      setLoadingUpcoming(true);
      const data = await getDayAvailabilities(
        { scope: 'upcoming' },
        { fallbackMessage: loadUpcomingErrorMessage },
      );
      setUpcomingEntries(
        [...data].sort((a, b) =>
          `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`),
        ),
      );
      return data;
    } catch (nextError) {
      console.error(nextError);
      setUpcomingEntries([]);
      return [];
    } finally {
      setLoadingUpcoming(false);
    }
  }, [loadUpcomingErrorMessage]);

  useEffect(() => {
    void loadEntries(date);
  }, [date, loadEntries]);

  useEffect(() => {
    void loadUpcoming();
  }, [loadUpcoming]);

  const createOverride = useCallback(
    async (payload: {
      date: string;
      startTime: string;
      endTime: string;
      kind: Kind;
    }) => {
      await createDayAvailability(payload, {
        fallbackMessage: loadDayErrorMessage,
      });
      await Promise.all([loadEntries(payload.date), loadUpcoming()]);
    },
    [loadDayErrorMessage, loadEntries, loadUpcoming],
  );

  const removeOverride = useCallback(
    async (availabilityId: string, targetDate: string) => {
      await deleteDayAvailability(availabilityId, {
        fallbackMessage: loadDayErrorMessage,
      });
      await Promise.all([loadEntries(targetDate), loadUpcoming()]);
    },
    [loadDayErrorMessage, loadEntries, loadUpcoming],
  );

  return {
    entries,
    upcomingEntries,
    loading,
    loadingUpcoming,
    error,
    setError,
    createOverride,
    removeOverride,
  };
}
