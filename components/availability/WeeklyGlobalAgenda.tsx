'use client';

import { useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyGlobalAgendaGrid } from '@/components/availability/WeeklyGlobalAgendaGrid';
import { formatServicePrice } from '@/components/availability/weekly-global-agenda-shared';
import { useWeeklyGlobalAgendaData } from '@/lib/client/hooks/useWeeklyGlobalAgendaData';
import { useWeeklyAvailabilities } from '@/lib/client/hooks/useWeeklyAvailabilities';
import {
  formatShortDate,
  parseISODateLocal,
} from '@/lib/client/utils/schedule-display';

export function WeeklyGlobalAgenda({ meRole }: { meRole: string | null }) {
  const t = useTranslations('weeklyAgenda');
  const locale = useLocale();
  const { user, isLoaded: isUserLoaded } = useUser();
  const currentUserId = user?.id ?? null;
  const [notice, setNotice] = useState<string | null>(null);

  const {
    availabilities: defaultAvailabilities,
    loading: loadingDefaults,
  } = useWeeklyAvailabilities({
    loadErrorMessage: t('error_load_week'),
  });

  const {
    entriesByDate,
    error,
    goToNextWeek,
    goToPreviousWeek,
    loadingWeek,
    slotsByDate,
    travelsByDate,
    weekDates,
    weekEndISO,
    weekStart,
  } = useWeeklyGlobalAgendaData({
    meRole,
    userId: currentUserId,
    userLoaded: isUserLoaded,
    loadErrorMessage: t('error_load_week'),
  });

  const totalWeeklyEarnings = useMemo(() => {
    if (!currentUserId) {
      return 0;
    }

    let total = 0;
    for (const slots of Object.values(slotsByDate)) {
      for (const slot of slots) {
        if (slot.dogsitterUserId !== currentUserId) {
          continue;
        }

        const numericPrice =
          typeof slot.servicePrice === 'number'
            ? slot.servicePrice
            : typeof slot.servicePrice === 'string'
              ? Number(slot.servicePrice)
              : null;

        if (numericPrice != null && Number.isFinite(numericPrice)) {
          total += numericPrice;
        }
      }
    }

    return total;
  }, [currentUserId, slotsByDate]);

  const isDogsitterForWeek = useMemo(() => {
    if (!currentUserId) {
      return false;
    }

    return Object.values(slotsByDate).some((slots) =>
      slots.some((slot) => slot.dogsitterUserId === currentUserId)
    );
  }, [currentUserId, slotsByDate]);

  const isLoading = loadingWeek || loadingDefaults || !isUserLoaded;

  const showMissingAddressNotice = () => {
    setNotice(t('notice_missing_address'));
    window.setTimeout(() => setNotice(null), 3000);
  };

  return (
    <Card className="relative">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t('header_title')}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('header_period', {
              from: formatShortDate(parseISODateLocal(weekStart), locale),
              to: formatShortDate(parseISODateLocal(weekEndISO), locale),
            })}
            <br />
            <span className="text-xs text-muted-foreground">
              {isDogsitterForWeek ? t('legend_dogsitter') : t('legend_default')}
            </span>
          </p>

          {isDogsitterForWeek && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t('earnings_label_prefix')}{' '}
              <span className="font-semibold">
                {formatServicePrice(totalWeeklyEarnings) ?? t('earnings_none')}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            {t('nav_prev_week')}
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            {t('nav_next_week')}
          </Button>
        </div>
      </CardHeader>

      {notice && (
        <div className="px-6">
          <Alert className="mb-3">
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="px-6">
          <Alert variant="destructive" className="mb-3">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent
        className={
          isLoading
            ? 'pointer-events-none opacity-40 transition-opacity'
            : 'transition-opacity'
        }
      >
        <div className="overflow-x-auto">
          <WeeklyGlobalAgendaGrid
            currentUserId={currentUserId}
            defaultAvailabilities={defaultAvailabilities}
            entriesByDate={entriesByDate}
            locale={locale}
            onMissingTravelAddress={showMissingAddressNotice}
            slotsByDate={slotsByDate}
            t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
            travelsByDate={travelsByDate}
            weekDates={weekDates}
          />
        </div>
      </CardContent>

      {isLoading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="pointer-events-none flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('loading_overlay')}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
