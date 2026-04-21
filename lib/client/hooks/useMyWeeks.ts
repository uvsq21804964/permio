'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getMyWeeks } from '@/lib/client/api/schedule-client';

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useMyWeeks<TResponse>(options: {
  userId?: string;
  weekStart?: string | null;
  loadErrorMessage?: string;
}) {
  const {
    userId,
    weekStart,
    loadErrorMessage = 'Failed to load agenda',
  } = options;

  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestRequestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    try {
      setLoading(true);
      setError(null);
      const response = await getMyWeeks<TResponse>(
        {
          userId,
          weekStart,
        },
        {
          fallbackMessage: loadErrorMessage,
        },
      );
      if (latestRequestIdRef.current !== requestId) {
        return null;
      }

      setData(response);
      return response;
    } catch (nextError) {
      if (latestRequestIdRef.current !== requestId) {
        return null;
      }

      const message = toErrorMessage(nextError, loadErrorMessage);
      setData(null);
      setError(message);
      return null;
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [loadErrorMessage, userId, weekStart]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    data,
    loading,
    error,
    reload,
  };
}
