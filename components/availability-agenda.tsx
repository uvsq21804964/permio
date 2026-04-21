'use client';
import { useTranslations, useLocale } from 'next-intl';

import type React from 'react';
import { useMemo, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AvailabilityRangesDialog,
} from '@/components/availability/AvailabilityRangesDialog';
import { AvailabilityAgendaHeader } from '@/components/availability/AvailabilityAgendaHeader';
import { AvailabilityAgendaSlotBlock } from '@/components/availability/AvailabilityAgendaSlotBlock';
import { AvailabilityWeekGrid } from '@/components/availability/AvailabilityWeekGrid';
import { useAvailabilityCurrentUser } from '@/lib/client/hooks/useAvailabilityCurrentUser';
import { useAvailabilityRangesDialogState } from '@/lib/client/hooks/useAvailabilityRangesDialogState';
import { useRelativeTimeFormatter } from '@/lib/client/hooks/useRelativeTimeFormatter';
import { useTimedNotice } from '@/lib/client/hooks/useTimedNotice';
import { useWeeklyAvailabilities } from '@/lib/client/hooks/useWeeklyAvailabilities';
import {
  DEFAULT_AVAILABILITY_END_HOUR,
  DEFAULT_AVAILABILITY_START_HOUR,
  formatHourLabel,
  formatTimeForLocale,
  isFrLocale,
} from '@/lib/client/utils/availability-time';
import {
  getAvailabilitiesForDay as getAvailabilitiesForDayFromList,
  validateTimeRanges,
} from '@/lib/client/utils/availability-editor';
import type { AvailabilityAgendaEntry } from '@/components/availability/availability-agenda-shared';

const START_HOUR = DEFAULT_AVAILABILITY_START_HOUR;
const END_HOUR = DEFAULT_AVAILABILITY_END_HOUR;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => i + START_HOUR
);
const PIXELS_PER_HOUR = 80;

type Availability = AvailabilityAgendaEntry;

export function AvailabilityAgenda() {
  const t = useTranslations('availabilityAgenda');
  const locale = useLocale();

  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastChangeAt, setLastChangeAt] = useState<Date | null>(null);
  const {
    addTimeRange,
    dialogOpen,
    openForCell,
    removeTimeRange,
    resetRanges,
    selectedDay,
    setDialogOpen,
    timeRanges,
    updateEndTime,
    updateStartTime,
  } = useAvailabilityRangesDialogState();
  const { notice, showNotice } = useTimedNotice(5000);
  const { formatRelativeFrom } = useRelativeTimeFormatter(locale, 30000);
  const {
    currentUser,
    error: usersError,
    hours,
    roleReady,
  } = useAvailabilityCurrentUser({
    currentUserErrorMessage: t('errors.currentUser'),
    fallbackDisplayName: t('userLabel.selfFallback'),
  });
  const selectedUserId = currentUser?.id ?? '';

  const {
    availabilities,
    loading: loadingAvail,
    error: availabilitiesError,
    reload: reloadAvailabilities,
    addAvailability,
    removeAvailability,
  } = useWeeklyAvailabilities({
    enabled: !!selectedUserId && roleReady,
    loadErrorMessage: t('errors.loadAvailabilities'),
  });
  const availReady = roleReady && !loadingAvail;

  const handleCellClick = (day: number, hour: number) => {
    if (!isEditing) return;

    openForCell(day, hour);
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDay === null || !selectedUserId) return;

    setError('');

    const validationError = validateTimeRanges(timeRanges, {
      rangeOrderMessage: (index) =>
        t('errors.rangeOrder', {
          index,
        }),
      rangeBoundsMessage: (index) =>
        t('errors.rangeBounds', {
          index,
        }),
      rangeStepMessage: (index) =>
        t('errors.rangeStep', {
          index,
        }),
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      for (const range of timeRanges) {
        await addAvailability({
          dayOfWeek: selectedDay,
          startTime: range.startTime,
          endTime: range.endTime,
        });
      }

      await reloadAvailabilities();
      setDialogOpen(false);
      resetRanges();
      setLastChangeAt(new Date());

      if (timeRanges.length > 1) {
        showNotice(
          t('notices.manyAdded', {
            count: timeRanges.length,
          })
        );
      } else {
        showNotice(
          t('notices.oneAdded', {
            start: formatTimeForLocale(timeRanges[0].startTime, locale),
            end: formatTimeForLocale(timeRanges[0].endTime, locale),
          })
        );
      }

      setError('');
    } catch (nextError) {
      console.error('[v0] Error creating availabilities:', nextError);
      setError(t('errors.createRange'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeAvailability(id);
      await reloadAvailabilities();
      setLastChangeAt(new Date());
      showNotice(t('notices.slotDeleted'));
    } catch (nextError) {
      console.error('[v0] Error deleting availability:', nextError);
    }
  };

  const getAvailabilitiesForDay = (day: number) => {
    return getAvailabilitiesForDayFromList(availabilities, day);
  };

  const dayLabels = useMemo(() => {
    const weekdayLocale = isFrLocale(locale) ? 'fr-FR' : 'en-US';
    const baseMonday = new Date(2000, 0, 3);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseMonday);
      date.setDate(baseMonday.getDate() + index);
      return date.toLocaleDateString(weekdayLocale, { weekday: 'long' });
    });
  }, [locale]);

  return (
    <>
      {roleReady && availReady ? (
        <Card>
          <CardHeader>
            <CardTitle className="sr-only">{t('title')}</CardTitle>
            <AvailabilityAgendaHeader
              currentUser={currentUser}
              formatRelativeFrom={formatRelativeFrom}
              hours={hours}
              isEditing={isEditing}
              lastChangeAt={lastChangeAt}
              notice={notice}
              onToggleEditing={() => setIsEditing((previous) => !previous)}
              t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
            />
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <AvailabilityWeekGrid
                dayLabels={dayLabels}
                getCellClassName={() =>
                  'border-b transition-colors ' +
                  (isEditing ? 'cursor-pointer hover:bg-muted/50' : '')
                }
                hourColumnTitle={t('table.hourColumn')}
                hours={HOURS}
                onCellClick={
                  isEditing
                    ? (dayIndex, hour) => handleCellClick(dayIndex, hour)
                    : undefined
                }
                pixelsPerHour={PIXELS_PER_HOUR}
                renderBlocks={(dayIndex) =>
                  getAvailabilitiesForDay(dayIndex).map((availability) => {
                    return (
                      <AvailabilityAgendaSlotBlock
                        key={availability.id}
                        availability={availability}
                        isEditing={isEditing}
                        locale={locale}
                        onDelete={handleDelete}
                        pixelsPerHour={PIXELS_PER_HOUR}
                        startHour={START_HOUR}
                      />
                    );
                  })
                }
                renderHourLabel={(hour) => formatHourLabel(hour, locale)}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          {usersError || availabilitiesError
            ? t('errors.loadStatusOrAvailabilities')
            : loadingAvail
            ? t('errors.loadAvailabilities')
            : t('errors.loadingGeneric')}
        </div>
      )}

      <AvailabilityRangesDialog
        dayLabel={selectedDay !== null ? t(`days.${selectedDay}` as any) : ''}
        error={error}
        locale={locale}
        onAddRange={addTimeRange}
        onEndTimeChange={updateEndTime}
        onOpenChange={setDialogOpen}
        onRemoveRange={removeTimeRange}
        onStartTimeChange={updateStartTime}
        onSubmit={handleSubmit}
        open={dialogOpen}
        t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
        timeRanges={timeRanges}
      />
    </>
  );
}
