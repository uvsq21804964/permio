'use client';

import { useInstructorServices } from '@/lib/client/hooks/useInstructorServices';

export function useBookingServices(options?: {
  enabled?: boolean;
  loadErrorMessage?: string;
}) {
  return useInstructorServices(options);
}
