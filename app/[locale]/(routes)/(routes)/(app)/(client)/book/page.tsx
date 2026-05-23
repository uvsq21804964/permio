'use client';

import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { BookingAgendaGrid } from '@/components/booking/BookingAgendaGrid';
import {
  BookingExactTimePicker,
  getSelectedWindowLabel,
} from '@/components/booking/BookingExactTimePicker';
import { BookingSelectionNudgeDialog } from '@/components/booking/BookingSelectionNudgeDialog';
import {
  formatShortDateFromISO,
  formatTimeForLocale,
} from '@/components/booking/booking-page-shared';
import {
  formatBookingPriceFromCents,
  getSmartPricingLabelKey,
  getSlotFinalPriceCents,
  getSlotReferencePriceCents,
} from '@/components/booking/booking-proposals-shared';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trackButtonClick } from '@/lib/client/button-tracking';
import { useBookPageState } from '@/lib/client/hooks/useBookPageState';
import type { SmartSlotLabel } from '@/lib/pricing/smartSlotPricing';
import {
  hasDiscountedSmartPrice,
  hasSurchargedSmartPrice,
} from '@/lib/shared/bookable-slots';
import { type Locale, withLocale } from '@/src/lib/i18n';

function getSelectionPricingBadgeClasses(label?: SmartSlotLabel | null) {
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

function getSelectionAdjustmentCopy(params: {
  adjustmentCents: number;
  locale: string;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  const { adjustmentCents, locale, t } = params;

  if (adjustmentCents < 0) {
    return t('selection.summarySaveAmount', {
      amount: formatBookingPriceFromCents(Math.abs(adjustmentCents), locale),
    });
  }

  if (adjustmentCents > 0) {
    return t('selection.summaryExtraAmount', {
      amount: formatBookingPriceFromCents(adjustmentCents, locale),
    });
  }

  return t('selection.summaryNoAdjustment');
}

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    agendaData,
    bookingAddress,
    bookingLoading,
    canGoNextWeek,
    canGoPrevWeek,
    currentSuggestedSlot,
    dayDisabled,
    earliestAllowed,
    error,
    handleKeepCurrentChoice,
    handleCurrentWeek,
    handleNextWeek,
    handlePrevWeek,
    handleRequestBooking,
    handleSelectExactSlot,
    handleSelectSlot,
    handleSwitchToAlternative,
    isCurrentWeek,
    isLoaded,
    isSignedIn,
    loading,
    locale,
    nowTop,
    nudgeAlternative,
    nudgeOpen,
    recommendedSlotIds,
    recommendedWindowCounts,
    selectedService,
    selectedSlot,
    selectedWindow,
    selectedWindowExactSlots,
    serviceError,
    setNudgeOpen,
    showNowLine,
    t,
    todayIso,
    weekDates,
    weekEnd,
    weekStart,
  } = useBookPageState();
  const currentWeekLabel = locale.startsWith('fr') ? 'Cette semaine' : 'This week';

  const bookingTranslator = useMemo(
    () =>
      t as unknown as (
        key: string,
        values?: Record<string, unknown>
      ) => string,
    [t],
  );

  const selectedSlotTimeLabel = selectedSlot
    ? t('selection.summaryTime', {
        start: formatTimeForLocale(selectedSlot.serviceStartTime, locale),
        end: formatTimeForLocale(selectedSlot.serviceEndTime, locale),
      })
    : null;
  const selectedSlotPriceLabel =
    selectedSlot && selectedService
      ? formatBookingPriceFromCents(
          getSlotFinalPriceCents(selectedSlot, selectedService.price),
          locale,
        )
      : null;
  const selectedSlotBasePriceLabel =
    selectedSlot && selectedService
      ? formatBookingPriceFromCents(
          getSlotReferencePriceCents(selectedSlot, selectedService.price),
          locale,
        )
      : null;
  const selectedSlotPricingLabelKey = selectedSlot?.smartPricing
    ? getSmartPricingLabelKey(selectedSlot.smartPricing.label)
    : null;
  const selectedSlotExplanation = selectedSlot?.smartPricing?.explanationKey
    ? t(selectedSlot.smartPricing.explanationKey)
    : null;
  const selectedSlotHasDiscount = hasDiscountedSmartPrice(selectedSlot?.smartPricing);
  const selectedSlotHasSurcharge = hasSurchargedSmartPrice(selectedSlot?.smartPricing);
  const selectedSlotAdjustmentCents =
    selectedSlot?.smartPricing?.adjustmentCents ?? 0;
  const selectedSlotTravelTotalMinutes = selectedSlot
    ? selectedSlot.travelBeforeMinutes + selectedSlot.travelAfterMinutes
    : 0;
  const selectedSlotIsRecommended = selectedSlot
    ? recommendedSlotIds.has(selectedSlot.id)
    : false;

  const handleTrackedRequestBooking = () => {
    trackButtonClick({
      buttonKey: 'booking_place_booking',
      buttonLabel: t('buttons.placeBooking'),
      buttonContext: 'booking_exact_slot',
      locale,
      metadata: {
        serviceName: selectedService?.name ?? null,
        selectedDate: selectedSlot?.date ?? null,
        selectedStart: selectedSlot?.serviceStartTime ?? null,
        selectedEnd: selectedSlot?.serviceEndTime ?? null,
        hasAddress: Boolean(bookingAddress),
      },
    });

    handleRequestBooking();
  };

  const handleBackToSuggestions = () => {
    const params = new URLSearchParams();
    const serviceId = searchParams.get('serviceId');
    const addr = searchParams.get('addr');
    const clientUserId = searchParams.get('clientUserId');

    if (serviceId) {
      params.set('serviceId', serviceId);
    }

    if (addr) {
      params.set('addr', addr);
    }

    if (clientUserId) {
      params.set('clientUserId', clientUserId);
    }

    const query = params.toString();
    router.push(
      query
        ? withLocale(`/book/proposals?${query}`, locale as Locale)
        : withLocale('/book/proposals', locale as Locale)
    );
  };

  let content: React.ReactNode;

  if (!isLoaded) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        {t('loadingSession')}
      </div>
    );
  } else if (!isSignedIn) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        {t('mustBeSignedIn')}
      </div>
    );
  } else {
    content = (
      <div className="mx-auto max-w-7xl space-y-6 pb-24 md:pb-6">
        <section className="rounded-[2rem] border border-black/10 bg-card p-5 shadow-sm md:p-7">
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={handleBackToSuggestions} className="-ml-3">
              {t('buttons.backToSuggestions')}
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/80">
                {t('header.eyebrow')}
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                  {t('header.title')}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground md:text-base">
                  {t('header.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevWeek}
                disabled={!canGoPrevWeek}
              >
                {t('buttons.prevWeek')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentWeek}
                disabled={isCurrentWeek}
              >
                {currentWeekLabel}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                disabled={!canGoNextWeek}
              >
                {t('buttons.nextWeek')}
              </Button>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {selectedService ? (
              <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-medium text-foreground">
                {selectedService.name}
              </span>
            ) : null}
            {selectedService?.durationMinutes ? (
              <span className="inline-flex rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs text-foreground/80">
                {t('header.badges.serviceDuration', {
                  duration: selectedService.durationMinutes,
                })}
              </span>
            ) : null}
            {selectedService?.isRemote ? (
              <span className="inline-flex rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs text-foreground/80">
                {t('header.badges.remote')}
              </span>
            ) : bookingAddress?.formattedAddress ? (
              <span className="inline-flex max-w-full rounded-full border border-black/10 bg-white/85 px-3 py-1 text-xs text-foreground/80">
                <span className="truncate">{bookingAddress.formattedAddress}</span>
              </span>
            ) : null}
          </div>

        </section>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ) : null}

        {serviceError ? (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{serviceError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle>{t('agenda.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t('agenda.weekLabel', {
                    start: formatShortDateFromISO(weekStart, locale),
                    end: formatShortDateFromISO(weekEnd, locale),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{t('agenda.help')}</p>
              </div>
            </CardHeader>

            <CardContent>
              {!agendaData ? (
                <div className="py-8 text-sm text-muted-foreground">
                  {t('agenda.loadingSlots')}
                </div>
              ) : (
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-xs text-muted-foreground">
                      {t('agenda.loadingSlots')}
                    </p>
                  ) : null}
                  <BookingAgendaGrid
                    dayDisabled={dayDisabled}
                    earliestAllowed={earliestAllowed}
                    isCurrentWeek={isCurrentWeek}
                    locale={locale}
                    nowTop={nowTop}
                    onSelectSlot={handleSelectSlot}
                    selectedServiceDuration={selectedService?.durationMinutes}
                    selectedSlot={selectedSlot}
                    selectedWindow={selectedWindow}
                    suggestedWindowCounts={recommendedWindowCounts}
                    showNowLine={showNowLine}
                    t={bookingTranslator}
                    todayIso={todayIso}
                    weekDates={weekDates}
                    weeklySlotsByDate={agendaData.clientSlotsByDate ?? {}}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {selectedWindow ? (
              <BookingExactTimePicker
                locale={locale}
                onSelectSlot={handleSelectExactSlot}
                recommendedSlotIds={recommendedSlotIds}
                selectedDateLabel={getSelectedWindowLabel(selectedWindow.date, locale)}
                selectedSlotId={selectedSlot ? `${selectedSlot.date}-${selectedSlot.serviceStartTime}-${selectedSlot.serviceEndTime}` : null}
                servicePrice={selectedService?.price ?? 0}
                slots={selectedWindowExactSlots}
                t={bookingTranslator}
              />
            ) : (
              <section className="rounded-3xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
                <h2 className="text-base font-semibold text-foreground">
                  {t('selection.title')}
                </h2>
                <p className="mt-2">{t('selection.description')}</p>
              </section>
            )}

            <section className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {t('selection.summaryEyebrow')}
                </p>

                {selectedSlot ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedSlotIsRecommended ? (
                        <Badge className="border-amber-300 bg-amber-100/90 text-amber-900">
                          {t('selection.recommended')}
                        </Badge>
                      ) : null}
                      {selectedSlotPricingLabelKey ? (
                        <Badge
                          variant="outline"
                          className={getSelectionPricingBadgeClasses(
                            selectedSlot?.smartPricing?.label,
                          )}
                        >
                          {t(selectedSlotPricingLabelKey)}
                        </Badge>
                      ) : null}
                    </div>

                    <h2 className="text-lg font-semibold">
                      {getSelectedWindowLabel(selectedSlot.date, locale)}
                    </h2>
                    <p className="text-sm text-muted-foreground">{selectedSlotTimeLabel}</p>

                    <div className="pt-1">
                      {selectedSlotHasDiscount || selectedSlotHasSurcharge ? (
                        <p className="text-xs text-muted-foreground line-through">
                          {selectedSlotBasePriceLabel}
                        </p>
                      ) : null}
                      {selectedSlotPriceLabel ? (
                        <p className="text-lg font-semibold text-foreground">
                          {selectedSlotPriceLabel}
                        </p>
                      ) : null}
                      {(selectedSlotHasDiscount || selectedSlotHasSurcharge) && (
                        <p
                          className={`mt-1 text-xs ${
                            selectedSlotHasDiscount
                              ? 'text-emerald-700'
                              : 'text-amber-900'
                          }`}
                        >
                          {getSelectionAdjustmentCopy({
                            adjustmentCents: selectedSlotAdjustmentCents,
                            locale,
                            t,
                          })}
                        </p>
                      )}
                    </div>

                    {selectedSlotExplanation ? (
                      <p className="text-sm text-muted-foreground">
                        {selectedSlotExplanation}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {t('timePicker.windowLabel', {
                          start: formatTimeForLocale(selectedSlot.windowStartTime, locale),
                          end: formatTimeForLocale(selectedSlot.windowEndTime, locale),
                        })}
                      </span>
                      <span className="inline-flex rounded-full border border-black/10 px-2 py-0.5">
                        {t('timePicker.travelTotal', {
                          minutes: selectedSlotTravelTotalMinutes,
                        })}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('selection.empty')}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Button
                  onClick={handleTrackedRequestBooking}
                  disabled={bookingLoading || !selectedService || !selectedSlot}
                >
                  {bookingLoading ? t('buttons.bookingInProgress') : t('buttons.placeBooking')}
                </Button>
              </div>
            </section>
          </div>
        </div>

        {selectedSlot ? (
          <section className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-background/95 p-3 backdrop-blur md:hidden">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {t('selection.summaryEyebrow')}
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {getSelectedWindowLabel(selectedSlot.date, locale)}
                </p>
                <p className="truncate text-xs text-muted-foreground">{selectedSlotTimeLabel}</p>
                {selectedSlotPriceLabel ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-xs font-medium text-foreground">
                      {selectedSlotPriceLabel}
                    </p>
                    {selectedSlotPricingLabelKey ? (
                      <span className="inline-flex rounded-full border border-black/10 bg-white/80 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {t(selectedSlotPricingLabelKey)}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Button
                onClick={handleTrackedRequestBooking}
                disabled={bookingLoading || !selectedService || !selectedSlot}
                className="shrink-0"
              >
                {bookingLoading ? t('buttons.bookingInProgress') : t('buttons.placeBooking')}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {content}
      <BookingSelectionNudgeDialog
        alternativeSlot={nudgeAlternative}
        currentSlot={currentSuggestedSlot}
        locale={locale}
        onKeepChoice={handleKeepCurrentChoice}
        onOpenChange={setNudgeOpen}
        onSwitchToAlternative={handleSwitchToAlternative}
        open={nudgeOpen}
        t={bookingTranslator}
      />
    </div>
  );
}
