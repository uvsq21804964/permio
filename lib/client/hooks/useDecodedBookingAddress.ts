'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  parseBookingAddressParam,
  type BookingAddress,
} from '@/lib/client/utils/booking';

export function useDecodedBookingAddress(
  addressParam: string | null,
  options?: {
    onError?: (error: unknown) => void;
  },
): BookingAddress | null {
  const onErrorRef = useRef(options?.onError);

  useEffect(() => {
    onErrorRef.current = options?.onError;
  }, [options?.onError]);

  return useMemo(
    () =>
      parseBookingAddressParam(addressParam, (error) => {
        onErrorRef.current?.(error);
      }),
    [addressParam],
  );
}
