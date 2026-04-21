'use client';

import { useEffect, useState } from 'react';
import {
  getMySubscriptionStatus,
  type MySubscriptionStatus,
} from '@/lib/client/api/me-client';

type SubscriptionStatus = 'loading' | 'done';

export function useMySubscriptionStatus(enabled: boolean) {
  const [subscription, setSubscription] = useState<MySubscriptionStatus | null>(
    null,
  );
  const [status, setStatus] = useState<SubscriptionStatus>(
    enabled ? 'loading' : 'done',
  );

  useEffect(() => {
    let cancelled = false;

    if (!enabled) {
      setSubscription(null);
      setStatus('done');
      return () => {
        cancelled = true;
      };
    }

    setSubscription(null);
    setStatus('loading');

    void getMySubscriptionStatus().then(
      (data) => {
        if (!cancelled) {
          setSubscription(data);
        }
      },
      () => {
        // Keep the UI non-blocking on the marketing page.
      },
    ).finally(() => {
      if (!cancelled) {
        setStatus('done');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    subscription,
    status,
  };
}
