'use client';

import { useCallback, useEffect, useState } from 'react';

import { getMyRole, type MyRoleResponse } from '@/lib/client/api/me-client';

type UseAvailabilityRoleGateOptions = {
  enabled?: boolean;
  loadErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useAvailabilityRoleGate(
  options: UseAvailabilityRoleGateOptions = {},
) {
  const { enabled = true, loadErrorMessage = 'Failed to load role' } = options;

  const [me, setMe] = useState<MyRoleResponse | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    if (!enabled) {
      setMe(null);
      setError(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getMyRole({
        fallbackMessage: loadErrorMessage,
      });
      setMe(data);
      return data;
    } catch (nextError) {
      const message = toErrorMessage(nextError, loadErrorMessage);
      setMe(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [enabled, loadErrorMessage]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const role = me?.role ?? null;
  const isClient = role === 'student';

  return {
    me,
    role,
    isClient,
    loading,
    error,
    reload: loadMe,
  };
}
