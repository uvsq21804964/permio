'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getInstructorServiceCatalog,
  type InstructorServicesResponse,
} from '@/lib/client/api/services-client';

type UseInstructorServicesOptions = {
  enabled?: boolean;
  loadErrorMessage?: string;
};

const EMPTY_CATALOG: InstructorServicesResponse = {
  instructorId: '',
  categories: [],
  services: [],
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useInstructorServices(
  options: UseInstructorServicesOptions = {},
) {
  const { enabled = true, loadErrorMessage = 'Failed to load services' } =
    options;

  const [catalog, setCatalog] = useState<InstructorServicesResponse>(
    EMPTY_CATALOG,
  );
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    if (!enabled) {
      setCatalog(EMPTY_CATALOG);
      setError(null);
      setLoading(false);
      return EMPTY_CATALOG;
    }

    try {
      setLoading(true);
      setError(null);
      const nextCatalog = await getInstructorServiceCatalog({
        fallbackMessage: loadErrorMessage,
      });
      setCatalog({
        instructorId: nextCatalog.instructorId ?? '',
        categories: nextCatalog.categories ?? [],
        services: nextCatalog.services ?? [],
      });
      return nextCatalog;
    } catch (nextError) {
      const message = toErrorMessage(nextError, loadErrorMessage);
      setCatalog(EMPTY_CATALOG);
      setError(message);
      return EMPTY_CATALOG;
    } finally {
      setLoading(false);
    }
  }, [enabled, loadErrorMessage]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  return {
    instructorId: catalog.instructorId,
    categories: catalog.categories,
    services: catalog.services,
    loading,
    error,
    reload: loadCatalog,
  };
}
