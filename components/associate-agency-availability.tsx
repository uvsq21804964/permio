'use client';

import React, { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AlertCircle } from 'lucide-react';

import {
  AvailabilityRangesDialog,
} from '@/components/availability/AvailabilityRangesDialog';
import { AssociateAgencyAvailabilityHeader } from '@/components/availability/AssociateAgencyAvailabilityHeader';
import { AssociateAgencyAvailabilitySlotBlock } from '@/components/availability/AssociateAgencyAvailabilitySlotBlock';
import { AvailabilityWeekGrid } from '@/components/availability/AvailabilityWeekGrid';
import { useAvailabilityRangesDialogState } from '@/lib/client/hooks/useAvailabilityRangesDialogState';
import {
  DEFAULT_AVAILABILITY_END_HOUR,
  DEFAULT_AVAILABILITY_START_HOUR,
  formatTimeForLocale,
  mergeAvailabilities,
} from '@/lib/client/utils/availability-time';
import {
  getAvailabilitiesForDay as getAvailabilitiesForDayFromList,
  slotKey,
  validateTimeRanges,
} from '@/lib/client/utils/availability-editor';
import type { AddressDetails } from '@/lib/client/utils/address';
import { useEditableWeeklyAvailabilityDraft } from '@/lib/client/hooks/useEditableWeeklyAvailabilityDraft';
import type { AssociateAgencyAvailabilityEntry } from '@/components/availability/associate-agency-availability-shared';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const START_HOUR = DEFAULT_AVAILABILITY_START_HOUR;
const END_HOUR = DEFAULT_AVAILABILITY_END_HOUR;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => i + START_HOUR
);

const PIXELS_PER_HOUR = 72;

type Availability = AssociateAgencyAvailabilityEntry;

type Props = {
  onboarding?: {
    address: AddressDetails;
    rawInput: string;
    agencyName: string;
    websiteUrl: string;
  } | null;
  onOnboarded?: (data: { organizationId?: string }) => void;
};

export default function AssociateAgencyAvailability({
  onboarding = null,
  onOnboarded,
}: Props) {
  const t = useTranslations('availabilityAgenda');
  const locale = useLocale();

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
  const {
    draft,
    dirty,
    error,
    loading,
    resetDraft,
    saveAll,
    saving,
    setDraft,
    setError,
  } = useEditableWeeklyAvailabilityDraft<Availability>({
    locale,
    onboarding,
    onOnboarded,
  });

  const dayLabels = useMemo(
    () => Array.from({ length: 7 }, (_, i) => t(`days.${i}` as any)),
    [t]
  );

  const getForDay = (day: number) => getAvailabilitiesForDayFromList(draft, day);

  const handleCellClick = (day: number, hour: number) => {
    openForCell(day, hour);
    setError('');
  };

  const handleSubmitDraft = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedDay === null) {
      return;
    }

    setError('');

    const validationError = validateTimeRanges(timeRanges, {
      rangeOrderMessage: (index) => t('errors.rangeOrder', { index }),
      rangeBoundsMessage: () =>
        locale.startsWith('fr')
          ? 'Plage autorisee : 05:00 a 23:00.'
          : 'Allowed range: 05:00 to 23:00.',
      rangeStepMessage: () =>
        locale.startsWith('fr')
          ? 'Choisissez des pas de 5 minutes.'
          : 'Please use 5-minute increments.',
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setDraft((prev) => {
      const next = [...prev];
      for (const range of timeRanges) {
        next.push({
          dayOfWeek: selectedDay,
          startTime: range.startTime,
          endTime: range.endTime,
        });
      }
      return mergeAvailabilities(next);
    });

    setDialogOpen(false);
    resetRanges();
  };

  const handleDeleteDraft = (slot: Availability) => {
    setDraft((prev) => prev.filter((item) => slotKey(item) !== slotKey(slot)));
  };

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 md:p-6 text-sm text-black/60">
        {locale.startsWith('fr') ? 'Chargement...' : 'Loading...'}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-3xl bg-white/95 border border-black/10 shadow-[0_18px_60px_rgba(0,0,0,0.10)] p-5 md:p-6 w-full">
        <AssociateAgencyAvailabilityHeader
          dirty={dirty}
          locale={locale}
          onboarding={Boolean(onboarding)}
          onReset={resetDraft}
          onSave={() => {
            void saveAll();
          }}
          saving={saving}
        />

        {error ? (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <AvailabilityWeekGrid
            dayColumnClassName="relative border-l"
            dayHeaderClassName="p-2 text-xs font-semibold text-center border-b border-l"
            dayLabels={dayLabels}
            getCellClassName={() =>
              'border-b cursor-pointer hover:bg-black/[0.03] transition-colors'
            }
            gridClassName="grid grid-cols-8"
            hourCellClassName="p-2 text-xs text-black/45 border-b"
            hourColumnTitle={t('table.hourColumn')}
            hourHeaderClassName="p-2 text-xs text-black/50 border-b"
            hours={HOURS}
            minWidthClassName="min-w-[980px]"
            onCellClick={handleCellClick}
            pixelsPerHour={PIXELS_PER_HOUR}
            renderBlocks={(dayIndex) =>
              getForDay(dayIndex).map((availability, index) => {
                return (
                  <AssociateAgencyAvailabilitySlotBlock
                    key={`${dayIndex}-${availability.startTime}-${availability.endTime}-${index}`}
                    availability={availability}
                    locale={locale}
                    onDelete={handleDeleteDraft}
                    pixelsPerHour={PIXELS_PER_HOUR}
                    startHour={START_HOUR}
                  />
                );
              })
            }
            renderHourLabel={(hour) =>
              formatTimeForLocale(`${String(hour).padStart(2, '0')}:00`, locale)
            }
          />
        </div>
      </div>

      <AvailabilityRangesDialog
        dayLabel={selectedDay !== null ? t(`days.${selectedDay}` as any) : ''}
        error={error}
        locale={locale}
        onAddRange={addTimeRange}
        onEndTimeChange={updateEndTime}
        onOpenChange={setDialogOpen}
        onRemoveRange={removeTimeRange}
        onStartTimeChange={updateStartTime}
        onSubmit={handleSubmitDraft}
        open={dialogOpen}
        rangeRowClassName="flex items-center gap-2 border p-3 rounded-2xl"
        t={t as unknown as (key: string, values?: Record<string, unknown>) => string}
        timeRanges={timeRanges}
      />
    </>
  );
}
