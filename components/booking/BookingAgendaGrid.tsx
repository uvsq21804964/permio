'use client';

import {
  formatHourLabel,
  formatShortDateFromISO,
  formatTimeForLocale,
  formatWeekdayShortFromISO,
  getAvailableSlotTone,
  getBlockStyle,
  getVisibleClientSlots,
  HOURS,
  PIXELS_PER_HOUR,
  type ClientBookingSlot,
  type SelectedBookingSlot,
} from '@/components/booking/booking-page-shared';

type BookingAgendaGridProps = {
  dayDisabled: Record<string, boolean>;
  earliestAllowed: Date;
  isCurrentWeek: boolean;
  locale: string;
  nowTop: number;
  onSelectSlot: (dateIso: string, slot: ClientBookingSlot) => void;
  selectedServiceDuration: number | null | undefined;
  selectedSlot: SelectedBookingSlot | null;
  selectedWindow: { date: string; slot: ClientBookingSlot } | null;
  showNowLine: boolean;
  suggestedWindowCounts: Record<string, number>;
  t: (key: string, values?: Record<string, unknown>) => string;
  todayIso: string;
  weekDates: string[];
  weeklySlotsByDate: Record<string, ClientBookingSlot[]>;
};

export function BookingAgendaGrid({
  dayDisabled,
  earliestAllowed,
  isCurrentWeek,
  locale,
  nowTop,
  onSelectSlot,
  selectedServiceDuration,
  selectedSlot,
  selectedWindow,
  showNowLine,
  suggestedWindowCounts,
  t,
  todayIso,
  weekDates,
  weeklySlotsByDate,
}: BookingAgendaGridProps) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-8">
          <div className="p-2 border-b text-sm font-medium text-muted-foreground">
            {t('agenda.hourColumn')}
          </div>
          {weekDates.map((dateIso) => {
            const isDisabledDay = dayDisabled[dateIso] ?? false;
            const isToday = dateIso === todayIso;

            return (
              <div
                key={dateIso}
                className={`p-2 border-b border-l text-center text-xs md:text-sm font-medium ${
                  isDisabledDay ? 'bg-muted/40 text-muted-foreground' : ''
                } ${
                  isToday && isCurrentWeek ? 'border-b-2 border-b-primary' : ''
                }`}
              >
                <div>{formatWeekdayShortFromISO(dateIso, locale)}</div>
                <div className="text-[11px] text-muted-foreground">
                  {formatShortDateFromISO(dateIso, locale)}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-8">
          <div className="border-r">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b text-xs md:text-sm text-muted-foreground px-2 flex items-start"
                style={{ height: `${PIXELS_PER_HOUR}px` }}
              >
                {formatHourLabel(hour, locale)}
              </div>
            ))}
          </div>

          {weekDates.map((dateIso) => {
            const availableSlots = getVisibleClientSlots({
              dateIso,
              rawSlots: weeklySlotsByDate?.[dateIso] ?? [],
              serviceDuration: selectedServiceDuration,
              earliestAllowed,
            });
            const isDisabledDay = dayDisabled[dateIso] ?? false;
            const isToday = dateIso === todayIso;

            return (
              <div
                key={dateIso}
                className={`relative border-r last:border-r-0 ${
                  isDisabledDay ? 'bg-muted/40' : ''
                }`}
              >
                {HOURS.map((hour) => (
                  <div
                    key={`${dateIso}-${hour}`}
                    className="border-b bg-background/50"
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  />
                ))}

                {availableSlots.map((slot, index) => {
                  const { top, height } = getBlockStyle(
                    slot.startTime,
                    slot.endTime
                  );
                  const isSelectedWindow =
                    selectedWindow?.date === dateIso &&
                    selectedWindow.slot.startTime === slot.startTime &&
                    selectedWindow.slot.endTime === slot.endTime;
                  const containsSelectedSlot =
                    selectedSlot?.date === dateIso &&
                    selectedSlot.windowStartTime === slot.startTime &&
                    selectedSlot.windowEndTime === slot.endTime;
                  const startLabel = formatTimeForLocale(slot.startTime, locale);
                  const endLabel = formatTimeForLocale(slot.endTime, locale);
                  const suggestedCount =
                    suggestedWindowCounts[
                      `${dateIso}-${slot.startTime}-${slot.endTime}`
                    ] ?? 0;
                  const tooltipLines = [
                    t('agenda.slotTooltip.slot', {
                      start: startLabel,
                      end: endLabel,
                    }),
                    t('agenda.slotTooltip.travelBefore', {
                      minutes: slot.travelBeforeMinutes,
                      label: slot.fromLabel,
                    }),
                    t('agenda.slotTooltip.travelAfter', {
                      minutes: slot.travelAfterMinutes,
                      label: slot.toLabel,
                    }),
                  ];

                  return (
                    <div
                      key={`${dateIso}-${index}-${slot.startTime}-${slot.endTime}`}
                      className={`absolute left-1 right-1 rounded-md border shadow-sm cursor-pointer transition ${getAvailableSlotTone()} ${
                        isSelectedWindow || containsSelectedSlot
                          ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background'
                          : ''
                      }`}
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        minHeight: '24px',
                      }}
                      title={tooltipLines.join('\n')}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectSlot(dateIso, slot)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          onSelectSlot(dateIso, slot);
                        }
                      }}
                    >
                      {suggestedCount > 0 ? (
                        <span className="absolute left-1 top-1 rounded-full border border-black/10 bg-black/[0.08] px-1.5 py-0.5 text-[8px] font-medium leading-none text-foreground/80">
                          {t('agenda.suggestedCount', { count: suggestedCount })}
                        </span>
                      ) : null}

                      <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                        <span className="text-[10px] leading-tight truncate">
                          {startLabel} - {endLabel}
                        </span>
                        <span className="text-[8px] leading-tight uppercase opacity-80 mt-0.5">
                          {containsSelectedSlot
                            ? t('agenda.badgeSelected')
                            : isSelectedWindow
                              ? t('agenda.badgeOpenWindow')
                              : t('agenda.badgeAvailable')}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {showNowLine && isToday ? (
                  <div
                    className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-primary/60"
                    style={{ top: `${nowTop}px` }}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
