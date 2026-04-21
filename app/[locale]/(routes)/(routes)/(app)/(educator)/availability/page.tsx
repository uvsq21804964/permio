'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

import { AvailabilityAgenda } from '@/components/availability-agenda';
import { DailyOverridesCard } from '@/components/availability/DailyOverridesCard';
import { WeeklyGlobalAgenda } from '@/components/availability/WeeklyGlobalAgenda';
import { useAvailabilityRoleGate } from '@/lib/client/hooks/useAvailabilityRoleGate';
type Role = 'student' | 'instructor' | 'admin';

export default function MyAvailabilitiesPage() {
  const t = useTranslations('myAvailabilities');
  const { isLoaded, isSignedIn } = useAuth();
  const { me, loading: roleLoading, error: roleError, isClient } =
    useAvailabilityRoleGate({
      enabled: isLoaded && isSignedIn,
      loadErrorMessage: t('errors.loadRole'),
    });

  const [activeView, setActiveView] = useState<'configure' | 'global'>(
    'configure'
  );

  const meRole = me?.role ?? null;

  // ✅ Vue effective : le client est forcé en "global"
  const effectiveView = useMemo<'configure' | 'global'>(() => {
    return isClient ? 'global' : activeView;
  }, [isClient, activeView]);

  // ✅ On force aussi l'état local pour éviter toute divergence
  useEffect(() => {
    if (isClient) setActiveView('global');
  }, [isClient]);

  if (!isLoaded) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t('loading.session')}
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t('auth.signInRequired')}
      </div>
    );
  }

  // ✅ On attend le rôle pour éviter d'afficher la mauvaise vue
  if (roleLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {t('loading.rights')}
      </div>
    );
  }

  if (roleError) {
    return <div className="p-6 text-sm text-red-600">{roleError}</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">{t('subtitle')}</p>
        </div>

        {/* ✅ Switch affiché uniquement si NON client */}
        {!isClient && (
          <div className="flex items-center gap-2 border rounded-full p-1 w-fit bg-muted/40">
            <button
              type="button"
              onClick={() => setActiveView('configure')}
              className={`px-4 py-1.5 text-sm rounded-full transition ${
                effectiveView === 'configure'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('tabs.configure')}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('global')}
              className={`px-4 py-1.5 text-sm rounded-full transition ${
                effectiveView === 'global'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('tabs.global')}
            </button>
          </div>
        )}

        {/* ✅ Configure uniquement pour non-client */}
        {effectiveView === 'configure' && !isClient && (
          <div className="space-y-6">
            <AvailabilityAgenda />
            <DailyOverridesCard />
          </div>
        )}

        {/* ✅ Global toujours accessible, et forcé pour client */}
        {effectiveView === 'global' && (
          <WeeklyGlobalAgenda meRole={meRole as Role} />
        )}
      </div>
    </div>
  );
}
