import { requestJson } from '@/lib/client/api/request';

type ScheduleErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
  details?: string;
};

type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
};

type GetMyWeeksQuery = {
  userId?: string;
  weekStart?: string | null;
};

function buildHeaders(orgId?: string): HeadersInit | undefined {
  if (!orgId) {
    return undefined;
  }

  return {
    'x-org-id': orgId,
  };
}

function buildMyWeeksUrl(query: GetMyWeeksQuery): string {
  const params = new URLSearchParams();
  if (query.userId) {
    params.set('userId', query.userId);
  }
  if (query.weekStart) {
    params.set('weekStart', query.weekStart);
  }

  const suffix = params.toString();
  return suffix ? `/api/me/weeks?${suffix}` : '/api/me/weeks';
}

export function getMyWeeks<TResponse>(
  query: GetMyWeeksQuery,
  options?: { fallbackMessage?: string },
) {
  return requestJson<TResponse, ScheduleErrorBody>(buildMyWeeksUrl(query), {
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load agenda',
  });
}

export function generateSchedule<TResponse>(options?: {
  orgId?: string;
  fallbackMessage?: string;
}) {
  return requestJson<TResponse, ScheduleErrorBody>('/api/schedule', {
    method: 'POST',
    credentials: 'include',
    headers: buildHeaders(options?.orgId),
    fallbackMessage:
      options?.fallbackMessage ?? 'Erreur lors de la génération du planning',
  });
}

export function commitSchedule(
  payload: { matches: Match[]; scope?: string; weekStart?: string },
  options?: { orgId?: string; fallbackMessage?: string },
) {
  return requestJson<unknown, ScheduleErrorBody>('/api/schedule/commit', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...buildHeaders(options?.orgId),
    },
    body: JSON.stringify(payload),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to commit schedule',
  });
}
