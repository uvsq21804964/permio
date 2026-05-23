'use client';

import {
  buildSuggestionReason,
  buildSuggestionTimeRange,
  formatBookingPriceFromCents,
  getSmartPricingLabelKey,
  getSlotFinalPriceCents,
  getSlotReferencePriceCents,
  type SuggestedBookingSlot,
} from '@/components/booking/booking-proposals-shared';
import {
  formatDayAndDate,
  formatTimeForLocale,
} from '@/components/booking/booking-page-shared';
import { Badge } from '@/components/ui/badge';
import type { SmartSlotLabel } from '@/lib/pricing/smartSlotPricing';
import {
  hasDiscountedSmartPrice,
  hasSurchargedSmartPrice,
} from '@/lib/shared/bookable-slots';

type BookingExactTimePickerProps = {
  locale: string;
  onSelectSlot: (slot: SuggestedBookingSlot) => void;
  recommendedSlotIds: Set<string>;
  selectedDateLabel: string;
  selectedSlotId: string | null;
  servicePrice: number | string;
  slots: SuggestedBookingSlot[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

function getPricingBadgeClasses(label?: SmartSlotLabel) {
  switch (label) {
    case 'best_route_price':
    case 'smart_discount':
      return 'border-emerald-300/70 bg-emerald-50 text-emerald-800';
    case 'flexible_slot':
      return 'border-amber-300/70 bg-amber-50 text-amber-900';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function getAdjustmentCopy(params: {
  adjustmentCents: number;
  locale: string;
  t: BookingExactTimePickerProps['t'];
}) {
  const { adjustmentCents, locale, t } = params;

  if (adjustmentCents < 0) {
    return t('timePicker.priceSaved', {
      amount: formatBookingPriceFromCents(Math.abs(adjustmentCents), locale),
    });
  }

  if (adjustmentCents > 0) {
    return t('timePicker.priceExtra', {
      amount: formatBookingPriceFromCents(adjustmentCents, locale),
    });
  }

  return null;
}

export function BookingExactTimePicker({
  locale,
  onSelectSlot,
  recommendedSlotIds,
  selectedDateLabel,
  selectedSlotId,
  servicePrice,
  slots,
  t,
}: BookingExactTimePickerProps) {
  const recommendedCount = slots.filter((slot) =>
    recommendedSlotIds.has(slot.id),
  ).length;

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
          const referencePriceCents = getSlotReferencePriceCents(slot, servicePrice);
          const finalPriceCents = getSlotFinalPriceCents(slot, servicePrice);
          const adjustmentCents = slot.smartPricing?.adjustmentCents ?? 0;
          const hasDiscount = hasDiscountedSmartPrice(slot.smartPricing);
          const hasSurcharge = hasSurchargedSmartPrice(slot.smartPricing);
          const pricingLabelKey = slot.smartPricing
            ? getSmartPricingLabelKey(slot.smartPricing.label)
            : null;
          const totalTravelMinutes =
            slot.travelBeforeMinutes + slot.travelAfterMinutes;
          const adjustmentCopy = getAdjustmentCopy({
            adjustmentCents,
            locale,
            t,
          });

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
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {isRecommended ? (
                      <Badge className="border-amber-300 bg-amber-100/90 text-amber-900">
                        {t('timePicker.recommended')}
                      </Badge>
                    ) : null}
                    {pricingLabelKey ? (
                      <Badge
                        variant="outline"
                        className={getPricingBadgeClasses(slot.smartPricing?.label)}
                      >
                        {t(pricingLabelKey)}
                      </Badge>
                    ) : null}
                    {isSelected ? (
                      <span className="inline-flex rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background">
                        {t('timePicker.selected')}
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm font-semibold md:text-[15px]">
                    {buildSuggestionTimeRange(slot, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {buildSuggestionReason(slot, t)}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  {hasDiscount || hasSurcharge ? (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatBookingPriceFromCents(referencePriceCents, locale)}
                    </p>
                  ) : null}
                  <p className="text-sm font-semibold text-foreground">
                    {formatBookingPriceFromCents(finalPriceCents, locale)}
                  </p>
                  {adjustmentCopy ? (
                    <p
                      className={`mt-1 text-[11px] ${
                        hasDiscount
                          ? 'text-emerald-700'
                          : hasSurcharge
                            ? 'text-amber-900'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {adjustmentCopy}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>
                  {t('timePicker.windowLabel', {
                    start: formatTimeForLocale(slot.windowStartTime, locale),
                    end: formatTimeForLocale(slot.windowEndTime, locale),
                  })}
                </span>
                <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
                  {t('timePicker.travelTotal', {
                    minutes: totalTravelMinutes,
                  })}
                </span>
                {totalTravelMinutes <= 20 ? (
                  <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
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
