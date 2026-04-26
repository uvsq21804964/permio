'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type BillingFeedbackToastProps = {
  message: string | null;
  tone: 'error' | 'success' | 'warning' | null;
};

export function BillingFeedbackToast({
  message,
  tone,
}: BillingFeedbackToastProps) {
  const shownRef = useRef(false);

  useEffect(() => {
    if (!message || !tone || shownRef.current) {
      return;
    }

    shownRef.current = true;

    if (tone === 'success') {
      toast.success(message);
      return;
    }

    if (tone === 'warning') {
      toast.warning(message);
      return;
    }

    toast.error(message);
  }, [message, tone]);

  return null;
}
