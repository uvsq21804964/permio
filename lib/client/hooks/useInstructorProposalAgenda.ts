'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  getInstructorWeeklyAgendaProposals,
  type BookingAddressPayload,
  type InstructorAgendaResponse,
} from '@/lib/client/api/booking-client';

type UseInstructorProposalAgendaOptions = {
  enabled?: boolean;
  weekStart?: string;
  isRemote?: boolean;
  bookingAddress?: BookingAddressPayload | null;
  loadErrorMessage?: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useInstructorProposalAgenda(
  options: UseInstructorProposalAgendaOptions,
) {
  const {
    enabled = true,
    weekStart,
    isRemote,
    bookingAddress,
    loadErrorMessage = 'Failed to fetch instructor proposal agenda',
  } = options;

  const [data, setData] = useState<InstructorAgendaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getInstructorWeeklyAgendaProposals(
        {
          weekStart,
          isRemote,
          bookingAddress,
        },
        {
          fallbackMessage: loadErrorMessage,
        },
      );
      setData(response);
      return response;
    } catch (nextError) {
      const message = toErrorMessage(nextError, loadErrorMessage);
      setData(null);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [
    bookingAddress,
    enabled,
    isRemote,
    loadErrorMessage,
    weekStart,
  ]);

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
