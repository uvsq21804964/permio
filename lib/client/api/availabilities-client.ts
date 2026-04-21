import { requestJson } from '@/lib/client/api/request';
import type { DayAvailability, DefaultAvailability, Slot, Travel } from '@/types/availability';

export type AvailabilityUserSummary = {
  name: string | null;
  role: string | null;
};

export type WeeklyAvailability = DefaultAvailability & {
  user?: AvailabilityUserSummary | null;
};

export type AvailabilityRecord = WeeklyAvailability & {
  id: string;
  userId: string;
};

type AvailabilityErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

type WeeklyAvailabilityPayload = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type DayAvailabilityPayload = {
  date: string;
  startTime: string;
  endTime: string;
  kind: 'available' | 'unavailable';
};

function buildUrl(
  path: string,
  params: Record<string, string | undefined | null>,
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

export function getWeeklyAvailabilities(options?: { fallbackMessage?: string }) {
  return requestJson<WeeklyAvailability[], AvailabilityErrorBody>(
    '/api/availabilities',
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to fetch availabilities',
    },
  );
}

export function replaceWeeklyAvailabilities(
  payload: { availabilities: WeeklyAvailabilityPayload[] },
  options?: { fallbackMessage?: string },
) {
  return requestJson<unknown, AvailabilityErrorBody>('/api/availabilities/bulk', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(payload),
    fallbackMessage:
      options?.fallbackMessage ?? 'Failed to replace availabilities',
  });
}

export function createWeeklyAvailability(
  payload: WeeklyAvailabilityPayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<WeeklyAvailability, AvailabilityErrorBody>(
    '/api/availabilities',
    {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(payload),
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to create availability',
    },
  );
}

export function deleteWeeklyAvailability(
  availabilityId: string,
  options?: { fallbackMessage?: string },
) {
  return requestJson<unknown, AvailabilityErrorBody>(
    `/api/availabilities/${availabilityId}`,
    {
      method: 'DELETE',
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to delete availability',
    },
  );
}

export function getDayAvailabilities(
  params: { date?: string; scope?: 'upcoming' },
  options?: { fallbackMessage?: string },
) {
  return requestJson<DayAvailability[], AvailabilityErrorBody>(
    buildUrl('/api/availabilities/day', {
      date: params.date,
      scope: params.scope,
    }),
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to fetch day availabilities',
    },
  );
}

export function createDayAvailability(
  payload: DayAvailabilityPayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<DayAvailability, AvailabilityErrorBody>(
    '/api/availabilities/day',
    {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(payload),
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to create day availability',
    },
  );
}

export function deleteDayAvailability(
  availabilityId: string,
  options?: { fallbackMessage?: string },
) {
  return requestJson<unknown, AvailabilityErrorBody>(
    `/api/availabilities/day/${availabilityId}`,
    {
      method: 'DELETE',
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to delete day availability',
    },
  );
}

export function getSlotsForWeek(
  params: { from: string; to: string },
  options?: { fallbackMessage?: string },
) {
  return requestJson<Slot[], AvailabilityErrorBody>(
    buildUrl('/api/slots/week', params),
    {
      credentials: 'include',
      fallbackMessage: options?.fallbackMessage ?? 'Failed to fetch slots',
    },
  );
}

export function getAllAvailabilities(options?: { fallbackMessage?: string }) {
  return requestJson<
    AvailabilityRecord[] | { availabilities?: AvailabilityRecord[]; data?: AvailabilityRecord[] },
    AvailabilityErrorBody
  >('/api/availabilities/all', {
    credentials: 'include',
    fallbackMessage:
      options?.fallbackMessage ?? 'Failed to fetch all availabilities',
  });
}

export function getTravelsForWeek(
  params: { from: string; to: string },
  options?: { fallbackMessage?: string },
) {
  return requestJson<Travel[], AvailabilityErrorBody>(
    buildUrl('/api/travels/week', params),
    {
      credentials: 'include',
      fallbackMessage: options?.fallbackMessage ?? 'Failed to fetch travels',
    },
  );
}
