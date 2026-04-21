'use client';

import { useCallback, useState } from 'react';

import {
  createBookingSlot,
  type CreateBookingSlotInput,
} from '@/lib/client/api/booking-client';

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useBookSlot(options?: { errorMessage?: string }) {
  const errorMessage = options?.errorMessage ?? 'Failed to create booking';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookSlot = useCallback(
    async (payload: CreateBookingSlotInput) => {
      try {
        setLoading(true);
        setError(null);
        return await createBookingSlot(payload, {
          fallbackMessage: errorMessage,
        });
      } catch (nextError) {
        const message = toErrorMessage(nextError, errorMessage);
        setError(message);
        throw nextError;
      } finally {
        setLoading(false);
      }
    },
    [errorMessage],
  );

  return {
    bookSlot,
    loading,
    error,
    clearError: () => setError(null),
  };
}
