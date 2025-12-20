'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

import { AvailabilityAgenda } from '@/components/availability-agenda';
import { DailyOverridesCard } from '@/components/availability/DailyOverridesCard';
import { WeeklyGlobalAgenda } from '@/components/availability/WeeklyGlobalAgenda';

type Role = 'student' | 'instructor' | 'admin';

type MeRoleResponse = {
  id: string;
  name: string;
  role: string;
  error?: string;
};

export default function MyAvailabilitiesPage() {
  const t = useTranslations('myAvailabilities');
  const { isLoaded, isSignedIn } = useAuth();

  const [me, setMe] = useState<MeRoleResponse | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'configure' | 'global'>(
    'configure'
  );

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const loadMe = async () => {
      setRoleLoading(true);
      setRoleError(null);

      try {
        const res = await fetch('/api/me/role', {
          credentials: 'include',
        });

        const data = (await res
          .json()
          .catch(() => ({}))) as Partial<MeRoleResponse>;

        if (!res.ok) {
          throw new Error(data?.error || `HTTP ${res.status}`);
        }

        setMe(data as MeRoleResponse);
      } catch (e: any) {
        console.error('[MyAvailabilitiesPage] /api/me/role error:', e);
        setMe(null);
        setRoleError(e?.message ?? t('errors.loadRole'));
      } finally {
        setRoleLoading(false);
      }
    };

    void loadMe();
  }, [isLoaded, isSignedIn, t]);

  const meRole = me?.role ?? null;
  const isClient = meRole === 'student';

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
