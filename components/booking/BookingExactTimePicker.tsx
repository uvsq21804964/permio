'use client';

import {
  buildSuggestionReason,
  buildSuggestionTimeRange,
  type SuggestedBookingSlot,
} from '@/components/booking/booking-proposals-shared';
import { formatDayAndDate, formatTimeForLocale } from '@/components/booking/booking-page-shared';

type BookingExactTimePickerProps = {
  locale: string;
  onSelectSlot: (slot: SuggestedBookingSlot) => void;
  recommendedSlotIds: Set<string>;
  selectedDateLabel: string;
  selectedSlotId: string | null;
  slots: SuggestedBookingSlot[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function BookingExactTimePicker({
  locale,
  onSelectSlot,
  recommendedSlotIds,
  selectedDateLabel,
  selectedSlotId,
  slots,
  t,
}: BookingExactTimePickerProps) {
  const recommendedCount = slots.filter((slot) => recommendedSlotIds.has(slot.id)).length;

  return (
    <section className="rounded-3xl border bg-card p-4 shadow-sm md:p-5">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">
          {t('timePicker.eyebrow')}
        </p>
        <h2 className="text-base font-semibold md:text-lg">{selectedDateLabel}</h2>
        <p className="text-sm text-muted-foreground">{t('timePicker.help')}</p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-[11px] font-medium text-foreground/80">
            {t('timePicker.count', { count: slots.length })}
          </span>
          {recommendedCount > 0 ? (
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-1 text-[11px] font-medium text-amber-900">
              {t('timePicker.recommendedCount', { count: recommendedCount })}
            </span>
          ) : null}
        </div>
      </div>

      {slots.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
          {t('timePicker.empty')}
        </div>
      ) : null}

      <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {slots.map((slot) => {
          const isSelected = selectedSlotId === slot.id;
          const isRecommended = recommendedSlotIds.has(slot.id);

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/80 shadow-sm'
                  : 'border-border bg-background hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold md:text-[15px]">
                    {buildSuggestionTimeRange(slot, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {buildSuggestionReason(slot, t)}
                  </p>
                </div>

                {isRecommended ? (
                  <span className="inline-flex shrink-0 rounded-full border border-amber-300 bg-amber-100/80 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-amber-900">
                    {t('timePicker.recommended')}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>
                  {t('timePicker.windowLabel', {
                    start: formatTimeForLocale(slot.windowStartTime, locale),
                    end: formatTimeForLocale(slot.windowEndTime, locale),
                  })}
                </span>
                {isSelected ? (
                  <span className="inline-flex rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                    {t('timePicker.selected')}
                  </span>
                ) : null}
                {slot.travelBeforeMinutes + slot.travelAfterMinutes <= 20 ? (
                  <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-medium">
                    {t('timePicker.quickTravel')}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function getSelectedWindowLabel(dateIso: string, locale: string) {
  return formatDayAndDate(dateIso, locale);
}
