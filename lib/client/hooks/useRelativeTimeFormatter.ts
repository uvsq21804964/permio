'use client';

import { useEffect, useMemo, useState } from 'react';
import { isFrLocale } from '@/lib/client/utils/availability-time';

export function useRelativeTimeFormatter(locale: string, refreshMs = 30000) {
  const formatter = useMemo(
    () =>
      new Intl.RelativeTimeFormat(isFrLocale(locale) ? 'fr' : 'en', {
        numeric: 'auto',
      }),
    [locale]
  );

  const [, setTick] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setTick((previous) => previous + 1),
      refreshMs
    );
    return () => clearInterval(intervalId);
  }, [refreshMs]);

  const formatRelativeFrom = (date: Date) => {
    const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
    if (Math.abs(diffSeconds) < 60) {
      return formatter.format(-diffSeconds, 'second');
    }

    const diffMinutes = Math.round(diffSeconds / 60);
    if (Math.abs(diffMinutes) < 60) {
      return formatter.format(-diffMinutes, 'minute');
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
      return formatter.format(-diffHours, 'hour');
    }

    const diffDays = Math.round(diffHours / 24);
    return formatter.format(-diffDays, 'day');
  };

  return {
    formatRelativeFrom,
  };
}
