'use client';

import { useCallback, useRef, useState } from 'react';

export function useTimedNotice(durationMs = 5000) {
  const [notice, setNotice] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const clearNotice = useCallback(() => {
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setNotice(null);
  }, []);

  const showNotice = useCallback(
    (message: string) => {
      if (timeoutRef.current != null) {
        window.clearTimeout(timeoutRef.current);
      }

      setNotice(message);
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        setNotice(null);
      }, durationMs);
    },
    [durationMs]
  );

  return {
    clearNotice,
    notice,
    showNotice,
  };
}
