'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { trackButtonClick } from '@/lib/client/button-tracking';

type UserJourneyTrackerProps = {
  locale: string;
};

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

export function UserJourneyTracker({ locale }: UserJourneyTrackerProps) {
  const pathname = usePathname();
  const currentPageRef = useRef<{ path: string; startedAt: number } | null>(null);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const previousPage = currentPageRef.current;
    const currentTime = nowMs();

    if (previousPage && previousPage.path !== pathname) {
      trackButtonClick({
        buttonKey: 'page_leave',
        buttonLabel: 'Page leave',
        buttonContext: 'user_journey',
        durationMs: Math.max(Math.round(currentTime - previousPage.startedAt), 0),
        eventType: 'page_leave',
        locale,
        pagePath: previousPage.path,
        targetHref: pathname,
      });
    }

    currentPageRef.current = { path: pathname, startedAt: currentTime };

    trackButtonClick({
      buttonKey: 'page_view',
      buttonLabel: 'Page view',
      buttonContext: 'user_journey',
      eventType: 'page_view',
      locale,
      pagePath: pathname,
    });
  }, [locale, pathname]);

  useEffect(() => {
    const recordCurrentPageLeave = () => {
      const currentPage = currentPageRef.current;
      if (!currentPage) {
        return;
      }

      trackButtonClick({
        buttonKey: 'page_leave',
        buttonLabel: 'Page leave',
        buttonContext: 'user_journey',
        durationMs: Math.max(Math.round(nowMs() - currentPage.startedAt), 0),
        eventType: 'page_leave',
        locale,
        pagePath: currentPage.path,
      });
    };

    window.addEventListener('pagehide', recordCurrentPageLeave);
    return () => {
      window.removeEventListener('pagehide', recordCurrentPageLeave);
    };
  }, [locale]);

  return null;
}
