import { ChevronRight } from 'lucide-react';

import type { ServicePricing } from '@/lib/client/api/services-client';
import type { BookingAddress } from '@/lib/client/utils/booking';

import {
  buildSuggestionReason,
  buildSuggestionTimeRange,
  formatBookingPrice,
  formatSuggestionDate,
  type SuggestedBookingSlot,
} from '@/components/booking/booking-proposals-shared';

type BookingSuggestionsGridProps = {
  bookingAddress: BookingAddress | null;
  bookingLoading: boolean;
  loadingSuggestions: boolean;
  locale: string;
  onBookSlot: (slot: SuggestedBookingSlot) => void;
  onSeeAllSlots: () => void;
  selectedService: ServicePricing;
  suggestions: SuggestedBookingSlot[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function BookingSuggestionsGrid({
  bookingAddress,
  bookingLoading,
  loadingSuggestions,
  locale,
  onBookSlot,
  onSeeAllSlots,
  selectedService,
  suggestions,
  t,
}: BookingSuggestionsGridProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-[2rem] border border-black/10 bg-card p-5 shadow-sm md:p-7">
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

          <div className="flex flex-col items-start gap-2 md:items-end">
            <button
              type="button"
              onClick={onSeeAllSlots}
              className="inline-flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:-translate-y-0.5 hover:bg-foreground/90 hover:shadow-md"
            >
              {t('header.seeAll')}
              <ChevronRight className="size-4" />
            </button>
            <p className="text-xs text-muted-foreground">{t('header.trustNote')}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <section className="rounded-2xl border border-black/5 bg-black/[0.03] p-4 text-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {t('serviceSection.label')}
            </p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{selectedService.name}</p>
                {selectedService.description ? (
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                    {selectedService.description}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-semibold">
                  {formatBookingPrice(selectedService.price, locale)}
                </p>
                {selectedService.duration_minutes != null ? (
                  <p className="text-muted-foreground">
                    {t('serviceSection.duration', {
                      duration: selectedService.duration_minutes,
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </section>

          {bookingAddress ? (
            <section className="rounded-2xl border border-black/5 bg-black/[0.03] p-4 text-sm">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {t('addressSection.label')}
              </p>
              <p className="mt-2 font-medium">{bookingAddress.formattedAddress}</p>
              <p className="text-xs text-muted-foreground">
                {bookingAddress.postalCode} {bookingAddress.city} ({bookingAddress.country})
              </p>
            </section>
          ) : null}
        </div>

      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold md:text-xl">
              {t('suggestions.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('suggestions.subtitle')}
            </p>
          </div>
          {loadingSuggestions ? (
            <span className="text-xs text-muted-foreground">
              {t('suggestions.loading')}
            </span>
          ) : null}
        </div>

        {!suggestions.length && !loadingSuggestions ? (
          <div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
            {t('suggestions.empty')}
          </div>
        ) : null}

        {suggestions.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {suggestions.slice(0, 4).map((slot, index) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => onBookSlot(slot)}
                disabled={bookingLoading}
                className="group flex min-h-[220px] cursor-pointer flex-col justify-between rounded-[1.5rem] border border-black/10 bg-card p-4 text-left shadow-sm ring-1 ring-transparent transition hover:-translate-y-1 hover:border-black/20 hover:ring-black/5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/80">
                      {index === 0 ? t('suggestions.badgeLead') : t('suggestions.badge')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatSuggestionDate(slot.date, locale)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xl font-semibold tracking-tight">
                      {buildSuggestionTimeRange(slot, locale)}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {buildSuggestionReason(slot, t)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-end">
                  <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-xs font-semibold text-foreground transition group-hover:border-black/20 group-hover:bg-black/[0.07]">
                    {bookingLoading ? t('booking.loading') : t('booking.button')}
                    <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>

    </div>
  );
}
