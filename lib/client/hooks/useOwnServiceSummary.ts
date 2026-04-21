'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOwnServiceCatalog } from '@/lib/client/api/services-client';

type Options = {
  enabled?: boolean;
  loadErrorMessage?: string;
};

type Summary = {
  servicesCount: number | null;
  joinCode: string | null;
};

const EMPTY_SUMMARY: Summary = {
  servicesCount: null,
  joinCode: null,
};

function toErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useOwnServiceSummary(options: Options = {}) {
  const {
    enabled = true,
    loadErrorMessage = 'Failed to load services summary',
  } = options;

  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setSummary(EMPTY_SUMMARY);
      setError(null);
      setLoading(false);
      return EMPTY_SUMMARY;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getOwnServiceCatalog({
        fallbackMessage: loadErrorMessage,
      });

      const nextSummary = {
        servicesCount: Array.isArray(data.services) ? data.services.length : 0,
        joinCode: data.joinCode ? String(data.joinCode) : null,
      };

      setSummary(nextSummary);
      return nextSummary;
    } catch (nextError) {
      setSummary(EMPTY_SUMMARY);
      setError(toErrorMessage(nextError, loadErrorMessage));
      return EMPTY_SUMMARY;
    } finally {
      setLoading(false);
    }
  }, [enabled, loadErrorMessage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    servicesCount: summary.servicesCount,
    joinCode: summary.joinCode,
    loading,
    error,
    reload,
  };
}
