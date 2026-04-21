'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useMemo, useState } from 'react';
import { getMyHours, getMyRole } from '@/lib/client/api/me-client';

type AvailabilityCurrentUser = {
  id: string;
  name: string;
  role: string;
};

type UserHours = {
  plannedMinutes: number | null;
  remainingMinutes: number | null;
};

type Options = {
  currentUserErrorMessage: string;
  fallbackDisplayName: string;
};

export function useAvailabilityCurrentUser({
  currentUserErrorMessage,
  fallbackDisplayName,
}: Options) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const [currentUser, setCurrentUser] = useState<AvailabilityCurrentUser | null>(
    null
  );
  const [hours, setHours] = useState<UserHours | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roleReady, setRoleReady] = useState(false);

  const resolvedFallbackName = useMemo(
    () =>
      fallbackDisplayName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      '',
    [fallbackDisplayName, user]
  );

  useEffect(() => {
    setError(null);

    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !userId) {
      setCurrentUser(null);
      setHours(null);
      setRoleReady(false);
      return;
    }

    (async () => {
      try {
        setRoleReady(false);
        const me = await getMyRole({
          fallbackMessage: currentUserErrorMessage,
        });

        setCurrentUser({
          id: me.id,
          name: me.name || resolvedFallbackName,
          role: me.role,
        });
        setRoleReady(true);
      } catch (nextError) {
        console.error('/api/me/role failed:', nextError);
        setError(currentUserErrorMessage);
        setCurrentUser({
          id: userId,
          name: resolvedFallbackName,
          role: 'student',
        });
        setRoleReady(true);
      }
    })();
  }, [
    currentUserErrorMessage,
    isLoaded,
    isSignedIn,
    resolvedFallbackName,
    userId,
  ]);

  useEffect(() => {
    if (!roleReady || !currentUser?.id) {
      return;
    }

    (async () => {
      try {
        const data = await getMyHours();
        setHours({
          plannedMinutes:
            typeof data.plannedMinutes === 'number' ? data.plannedMinutes : null,
          remainingMinutes:
            typeof data.remainingMinutes === 'number'
              ? data.remainingMinutes
              : null,
        });
      } catch (nextError) {
        console.warn('/api/me/hours failed', nextError);
        setHours(null);
      }
    })();
  }, [currentUser?.id, roleReady]);

  return {
    currentUser,
    error,
    hours,
    roleReady,
  };
}
