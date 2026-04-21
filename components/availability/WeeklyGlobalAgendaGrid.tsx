'use client';

import React from 'react';
import {
  HOURS,
  PIXELS_PER_HOUR,
  getBlockStyle,
  getDayOverrideColor,
  getDefaultBlockColor,
  getSlotBlockColor,
} from '@/lib/availability-utils';
import type {
  DayAvailability,
  DefaultAvailability,
  Slot,
  Travel,
} from '@/types/availability';
import {
  formatHourLabel,
  formatShortDate,
  formatTimeForLocale,
  isFrenchLocale,
  parseISODateLocal,
} from '@/lib/client/utils/schedule-display';
import {
  buildGoogleMapsUrl,
  formatServicePrice,
} from '@/components/availability/weekly-global-agenda-shared';

type TranslationFn = (key: string, values?: Record<string, unknown>) => string;

type WeeklyGlobalAgendaGridProps = {
  currentUserId: string | null;
  defaultAvailabilities: DefaultAvailability[];
  entriesByDate: Record<string, DayAvailability[]>;
  locale: string;
  onMissingTravelAddress: () => void;
  slotsByDate: Record<string, Slot[]>;
  t: TranslationFn;
  travelsByDate: Record<string, Travel[]>;
  weekDates: string[];
};

export function WeeklyGlobalAgendaGrid({
  currentUserId,
  defaultAvailabilities,
  entriesByDate,
  locale,
  onMissingTravelAddress,
  slotsByDate,
  t,
  travelsByDate,
  weekDates,
}: WeeklyGlobalAgendaGridProps) {
  return (
    <div className="min-w-[900px]">
      <div className="grid grid-cols-8">
        <div className="border-b p-2 text-sm font-medium text-muted-foreground">
          {t('column_hour')}
        </div>
        {weekDates.map((dateIso) => (
          <div
            key={dateIso}
            className="border-b border-l p-2 text-center text-xs font-medium md:text-sm"
          >
            <div>{formatWeekdayShortISO(dateIso, locale)}</div>
            <div className="text-[11px] text-muted-foreground">
              {formatShortDate(parseISODateLocal(dateIso), locale)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-8">
        <div className="border-r">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex items-start border-b px-2 text-xs text-muted-foreground md:text-sm"
              style={{ height: `${PIXELS_PER_HOUR}px` }}
            >
              {formatHourLabel(hour, locale)}
            </div>
          ))}
        </div>

        {weekDates.map((dateIso, dayIndex) => (
          <AgendaDayColumn
            key={dateIso}
            currentUserId={currentUserId}
            dateIso={dateIso}
            dayIndex={dayIndex}
            defaultAvailabilities={defaultAvailabilities}
            entries={entriesByDate[dateIso] || []}
            locale={locale}
            onMissingTravelAddress={onMissingTravelAddress}
            slots={slotsByDate[dateIso] || []}
            t={t}
            travels={travelsByDate[dateIso] || []}
          />
        ))}
      </div>
    </div>
  );
}

function AgendaDayColumn({
  currentUserId,
  dateIso,
  dayIndex,
  defaultAvailabilities,
  entries,
  locale,
  onMissingTravelAddress,
  slots,
  t,
  travels,
}: {
  currentUserId: string | null;
  dateIso: string;
  dayIndex: number;
  defaultAvailabilities: DefaultAvailability[];
  entries: DayAvailability[];
  locale: string;
  onMissingTravelAddress: () => void;
  slots: Slot[];
  t: TranslationFn;
  travels: Travel[];
}) {
  const defaultsForDay = defaultAvailabilities.filter(
    (availability) => availability.dayOfWeek === dayIndex
  );

  return (
    <div className="relative border-r last:border-r-0">
      {HOURS.map((hour) => (
        <div
          key={`${dateIso}-${hour}`}
          className="border-b bg-background/50"
          style={{ height: `${PIXELS_PER_HOUR}px` }}
        />
      ))}

      {defaultsForDay.map((availability) => (
        <DefaultAvailabilityBlock
          key={`default-${availability.id}-${dateIso}`}
          availability={availability}
          locale={locale}
          t={t}
        />
      ))}

      {entries.map((entry) => (
        <DayOverrideBlock key={entry.id} entry={entry} locale={locale} t={t} />
      ))}

      {travels.map((travel) => (
        <TravelBlock
          key={`travel-${travel.id}`}
          locale={locale}
          onMissingTravelAddress={onMissingTravelAddress}
          t={t}
          travel={travel}
        />
      ))}

      {slots.map((slot) => (
        <BookedSlotBlock
          key={`slot-${slot.id}`}
          currentUserId={currentUserId}
          locale={locale}
          slot={slot}
          t={t}
        />
      ))}
    </div>
  );
}

function DefaultAvailabilityBlock({
  availability,
  locale,
  t,
}: {
  availability: DefaultAvailability;
  locale: string;
  t: TranslationFn;
}) {
  const { top, height } = getBlockStyle(
    availability.startTime,
    availability.endTime
  );
  const startLabel = formatTimeForLocale(availability.startTime, locale);
  const endLabel = formatTimeForLocale(availability.endTime, locale);

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border shadow-sm ${getDefaultBlockColor()}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '22px', opacity: 0.85 }}
      title={t('default_block_title', { start: startLabel, end: endLabel })}
    >
      <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
        <span className="truncate text-[10px] leading-tight">
          {startLabel} - {endLabel}
        </span>
        <span className="mt-0.5 text-[8px] uppercase leading-tight opacity-70">
          {t('default_block_label')}
        </span>
      </div>
    </div>
  );
}

function DayOverrideBlock({
  entry,
  locale,
  t,
}: {
  entry: DayAvailability;
  locale: string;
  t: TranslationFn;
}) {
  const { top, height } = getBlockStyle(entry.startTime, entry.endTime);
  const startLabel = formatTimeForLocale(entry.startTime, locale);
  const endLabel = formatTimeForLocale(entry.endTime, locale);
  const label =
    entry.kind === 'available'
      ? t('override_block_label_available')
      : t('override_block_label_unavailable');

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border shadow-sm ${getDayOverrideColor(
        entry.kind
      )}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '24px' }}
      title={`${startLabel}-${endLabel}`}
    >
      <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
        <span>
          {startLabel} - {endLabel}
        </span>
        <span className="mt-0.5 text-[8px] uppercase leading-tight opacity-80">
          {label}
        </span>
      </div>
    </div>
  );
}

function TravelBlock({
  locale,
  onMissingTravelAddress,
  t,
  travel,
}: {
  locale: string;
  onMissingTravelAddress: () => void;
  t: TranslationFn;
  travel: Travel;
}) {
  const { top, height } = getBlockStyle(travel.startTime, travel.endTime);
  const startLabel = formatTimeForLocale(travel.startTime, locale);
  const endLabel = formatTimeForLocale(travel.endTime, locale);

  const tooltipLines: string[] = [
    t('travel_tooltip_time', { start: startLabel, end: endLabel }),
  ];

  if (travel.client_formatted_address) {
    tooltipLines.push(
      t('travel_tooltip_destination', {
        address: travel.client_formatted_address,
      })
    );
  }
  if (travel.dogsitter_formatted_address) {
    tooltipLines.push(
      t('travel_tooltip_origin', {
        address: travel.dogsitter_formatted_address,
      })
    );
  }

  const handleClick = () => {
    const url = buildGoogleMapsUrl(travel);
    if (!url) {
      onMissingTravelAddress();
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={tooltipLines.join('\n')}
      className="absolute left-2 right-2 cursor-pointer rounded-md border border-amber-300 bg-amber-100/80 shadow-sm hover:border-amber-400 hover:bg-amber-200/90 focus:outline-none focus:ring-2 focus:ring-amber-500"
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '20px', zIndex: 5 }}
    >
      <div className="flex h-full flex-col items-start justify-center gap-0.5 px-1 py-0.5">
        <span>
          {startLabel} - {endLabel}
        </span>
        <span className="truncate text-[8px] uppercase tracking-wide opacity-80">
          {t('travel_label')}
        </span>
      </div>
    </button>
  );
}

function BookedSlotBlock({
  currentUserId,
  locale,
  slot,
  t,
}: {
  currentUserId: string | null;
  locale: string;
  slot: Slot;
  t: TranslationFn;
}) {
  const { top, height } = getBlockStyle(slot.startTime, slot.endTime);
  const startLabel = formatTimeForLocale(slot.startTime, locale);
  const endLabel = formatTimeForLocale(slot.endTime, locale);
  const isDogsitter = currentUserId === slot.dogsitterUserId;
  const isClient = currentUserId === slot.clientUserId;
  const fallbackName = isDogsitter
    ? t('slot_client_unknown')
    : t('slot_instructor_unknown');
  const mainName =
    (isDogsitter ? slot.clientName : slot.dogsitterName) || fallbackName;
  const mainLabel = isDogsitter
    ? t('slot_main_label_client')
    : t('slot_main_label_instructor');

  const tooltipLines: string[] = [
    t('slot_tooltip_time', { start: startLabel, end: endLabel }),
    t('slot_tooltip_main', { label: mainLabel, name: mainName }),
  ];

  if (isDogsitter && slot.dogsitterName) {
    tooltipLines.push(t('slot_tooltip_you', { name: slot.dogsitterName }));
  } else if (isClient && slot.clientName) {
    tooltipLines.push(t('slot_tooltip_client', { name: slot.clientName }));
  }

  const priceLabel = isDogsitter
    ? formatServicePrice(slot.servicePrice)
    : null;
  if (slot.serviceName) {
    tooltipLines.push(
      priceLabel
        ? t('slot_tooltip_service_with_price', {
            service: slot.serviceName,
            price: priceLabel,
          })
        : t('slot_tooltip_service', { service: slot.serviceName })
    );
  } else if (priceLabel) {
    tooltipLines.push(t('slot_tooltip_price', { price: priceLabel }));
  }

  if (slot.formatted_address) {
    tooltipLines.push(
      t('slot_tooltip_address', { address: slot.formatted_address })
    );
  }

  const contentLines: React.ReactNode[] = [
    <span key="time" className="truncate font-mono text-[9px] leading-tight">
      {slot.startTime} - {slot.endTime}
    </span>,
    <span key="name" className="truncate text-[10px] font-medium leading-tight">
      {mainName}
    </span>,
  ];

  if (slot.serviceName) {
    contentLines.push(
      <span
        key="service"
        className="truncate text-[8px] leading-tight opacity-85"
      >
        {slot.serviceName}
      </span>
    );
  }

  if (isDogsitter && slot.servicePrice != null) {
    contentLines.push(
      <span key="price" className="truncate text-[10px] leading-tight opacity-85">
        {formatServicePrice(slot.servicePrice)}
      </span>
    );
  }

  const maxLines = Math.max(
    1,
    Math.min(Math.floor((height - 4) / 11), contentLines.length)
  );

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border shadow-sm ${getSlotBlockColor()}`}
      style={{ top: `${top}px`, height: `${height}px`, minHeight: '26px', zIndex: 10 }}
      title={tooltipLines.join('\n')}
    >
      <div className="flex h-full flex-col items-start justify-center gap-0.5 px-1 py-0.5">
        {contentLines.slice(0, maxLines)}
      </div>
    </div>
  );
}

function formatWeekdayShortISO(iso: string, locale: string): string {
  return parseISODateLocal(iso).toLocaleDateString(
    isFrenchLocale(locale) ? 'fr-FR' : 'en-US',
    { weekday: 'short' }
  );
}
