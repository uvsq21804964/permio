'use client';

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  ApiDay,
  buildTravelMapsUrl,
  DAYS,
  formatServicePrice,
  getCounterpartName,
  getSlotColorClass,
  HOURS,
  PIXELS_PER_HOUR,
  Role,
  Slot,
  START_HOUR,
  TravelSlot,
} from '@/components/schedule/last-week-agenda-shared';
import {
  formatHourLabel,
  formatTimeForLocale,
  getTimelineBlockStyle,
} from '@/lib/client/utils/schedule-display';
import { isOutsideDefaultWorkingHours } from '@/lib/client/utils/working-hours';

type TranslationFn = (key: string, values?: Record<string, unknown>) => string;

type DayHeader = {
  label: string;
  dateLabel: string;
  iso: string;
  isToday: boolean;
};

type LastWeekAgendaGridProps = {
  dayHeaders: DayHeader[];
  daysMap: Map<number, ApiDay>;
  locale: string;
  onSlotCancelled: () => Promise<unknown>;
  showTravels: boolean;
  t: TranslationFn;
  travelsByDate: Record<string, TravelSlot[]>;
  viewerRole?: Role;
};

type SelectedSlotDetails = {
  dateIso: string;
  dateLabel: string;
  slot: Slot;
};

type SlotReview = {
  id: string;
  rating: number;
  comment: string | null;
};

function normalizeSlotId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return String(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }

  return null;
}

function parseLocalSlotDateTime(dateIso: string, time: string) {
  const [year, month, day] = dateIso.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  return new Date(
    year,
    (month || 1) - 1,
    day || 1,
    hours || 0,
    minutes || 0,
    0,
    0,
  );
}

function isStudentCancellationLocked(
  viewerRole: Role | undefined,
  selectedSlotDetails: SelectedSlotDetails | null,
) {
  if (viewerRole !== 'student' || !selectedSlotDetails?.slot?.startTime) {
    return false;
  }

  const slotDate = parseLocalSlotDateTime(
    selectedSlotDetails.dateIso,
    selectedSlotDetails.slot.startTime,
  );
  const diff = slotDate.getTime() - Date.now();

  return diff > 0 && diff < 48 * 60 * 60 * 1000;
}

function isPastSlot(selectedSlotDetails: SelectedSlotDetails | null) {
  if (!selectedSlotDetails?.slot?.endTime) {
    return false;
  }

  return (
    parseLocalSlotDateTime(
      selectedSlotDetails.dateIso,
      selectedSlotDetails.slot.endTime,
    ).getTime() <= Date.now()
  );
}

function isPastDayIso(isoDate: string | undefined) {
  if (!isoDate) {
    return false;
  }

  const today = new Date();
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  return isoDate < todayIso;
}

export function LastWeekAgendaGrid({
  dayHeaders,
  daysMap,
  locale,
  onSlotCancelled,
  showTravels,
  t,
  travelsByDate,
  viewerRole,
}: LastWeekAgendaGridProps) {
  const [selectedSlotDetails, setSelectedSlotDetails] =
    useState<SelectedSlotDetails | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const studentCancellationLocked = isStudentCancellationLocked(
    viewerRole,
    selectedSlotDetails,
  );
  const pastSlotSelected = isPastSlot(selectedSlotDetails);
  const reviewablePastSlot =
    viewerRole === 'student' && pastSlotSelected;

  return (
    <>
      <div className="max-h-[70vh] overflow-auto">
        <div className="min-w-[800px]">
        <div className="sticky top-0 z-20 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:grid-cols-8">
          <div className="sticky left-0 z-30 border-b bg-background/95 px-1 py-2 text-[11px] font-medium text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80 md:p-2 md:text-sm">
            {t('table.hourColumn')}
          </div>
          {dayHeaders.map((day) => (
            <div
              key={day.label}
              className={`relative overflow-hidden border-b border-r p-2 text-center text-sm font-medium ${
                day.isToday ? 'bg-green-50 text-green-900' : ''
              }`}
            >
              {isPastDayIso(day.iso) ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(135deg, rgba(148,163,184,0.16) 0px, rgba(148,163,184,0.16) 7px, transparent 7px, transparent 14px)',
                  }}
                />
              ) : null}
              <div className="relative z-10">{day.label}</div>
              {day.dateLabel ? (
                <div className="relative z-10 mt-0.5 text-[11px] text-neutral-500">
                  {day.dateLabel}
                </div>
              ) : null}
              {day.isToday ? (
                <span className="relative z-10 mt-1 inline-flex items-center rounded border border-green-500 bg-green-200 px-1 py-0.5 text-[10px] font-medium text-green-900">
                  {t('todayBadge')}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-0 md:grid-cols-8">
          <div className="sticky left-0 z-10 bg-background">
            {HOURS.map((hour) => (
              <div
                key={`hour-${hour}`}
                className={`border-b border-r px-1 py-2 text-[11px] text-muted-foreground md:p-2 md:text-sm ${
                  isOutsideDefaultWorkingHours(hour)
                    ? 'bg-slate-100/70'
                    : 'bg-background'
                }`}
                style={{ height: `${PIXELS_PER_HOUR}px` }}
              >
                {formatHourLabel(hour, locale)}
              </div>
            ))}
          </div>

          {DAYS.map((_, dayIndex) => {
            const day = daysMap.get(dayIndex);
            const slots = day?.slots ?? [];
            const dayHeader = dayHeaders[dayIndex];
            const isoDate = dayHeader?.iso;
            const travelsForDay = isoDate ? travelsByDate[isoDate] ?? [] : [];

            return (
              <div
                key={`day-${dayIndex}`}
                className={`relative border-r ${
                  dayHeader?.isToday ? 'bg-green-100/40 ring-1 ring-green-500' : ''
                }`}
              >
                {isPastDayIso(isoDate) ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(135deg, rgba(148,163,184,0.16) 0px, rgba(148,163,184,0.16) 7px, transparent 7px, transparent 14px)',
                    }}
                  />
                ) : null}

                {HOURS.map((hour) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={isOutsideDefaultWorkingHours(hour) ? 'border-b bg-slate-100/70' : 'border-b'}
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  />
                ))}

                {showTravels && isoDate
                  ? travelsForDay.map((travel, index) => (
                      <TravelBlock
                        key={`travel-${isoDate}-${index}`}
                        locale={locale}
                        t={t}
                        travel={travel}
                      />
                    ))
                  : null}

                {slots.map((slot, index) => (
                  <ReservedSlotBlock
                    key={`${dayIndex}-${index}`}
                    locale={locale}
                    onClick={() => {
                      if (!isoDate) return;

                      setSelectedSlotDetails({
                        dateIso: isoDate,
                        dateLabel: formatLongDate(isoDate, locale),
                        slot,
                      });
                    }}
                    slot={slot}
                    t={t}
                    viewerRole={viewerRole}
                  />
                ))}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <SlotDetailsDialog
        cancelling={cancelling}
        locale={locale}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSlotDetails(null);
            setConfirmCancelOpen(false);
          }
        }}
        onRequestCancel={() => setConfirmCancelOpen(true)}
        open={!!selectedSlotDetails}
        selectedSlotDetails={selectedSlotDetails}
        studentCancellationLocked={studentCancellationLocked}
        t={t}
        viewerRole={viewerRole}
        pastSlotSelected={pastSlotSelected}
        reviewablePastSlot={reviewablePastSlot}
      />

      <ConfirmCancelDialog
        cancelling={cancelling}
        onConfirm={async () => {
          const slotId = normalizeSlotId(selectedSlotDetails?.slot.id);
          if (!slotId) {
            toast.error(t('slot.dialog.cancelError'));
            return;
          }

          if (studentCancellationLocked) {
            toast.error(t('slot.dialog.cancelTooLateError'));
            return;
          }

          if (pastSlotSelected) {
            toast.error(t('slot.dialog.cancelPastError'));
            return;
          }

          try {
            setCancelling(true);

            const response = await fetch(`/api/slots/${slotId}`, {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'x-locale': locale,
              },
            });

            if (!response.ok) {
              let errorCode = 'UNKNOWN_ERROR';
              let errorDetail = '';
              try {
                const body = await response.json();
                errorCode =
                  typeof body?.error === 'string' && body.error.trim().length > 0
                    ? body.error
                    : errorCode;
                errorDetail =
                  typeof body?.detail === 'string' && body.detail.trim().length > 0
                    ? body.detail.trim()
                    : '';
              } catch {
                errorCode = 'UNKNOWN_ERROR';
                errorDetail = '';
              }

              throw new Error(
                errorDetail ? `${errorCode}: ${errorDetail}` : errorCode,
              );
            }

            setConfirmCancelOpen(false);
            setSelectedSlotDetails(null);
            await onSlotCancelled();
            toast.success(t('slot.dialog.cancelSuccess'));
          } catch (error) {
            console.error('cancel slot error', error);
            toast.error(
              error instanceof Error &&
                (error.message === 'CLIENT_CANCELLATION_TOO_LATE' ||
                  error.message.startsWith('CLIENT_CANCELLATION_TOO_LATE:'))
                ? t('slot.dialog.cancelTooLateError')
                : t('slot.dialog.cancelError'),
            );
          } finally {
            setCancelling(false);
          }
        }}
        onOpenChange={(open) => {
          if (!cancelling) {
            setConfirmCancelOpen(open);
          }
        }}
        open={confirmCancelOpen}
        selectedSlotDetails={selectedSlotDetails}
        t={t}
      />
    </>
  );
}

function formatLongDate(isoDate: string, locale: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);

  return new Intl.DateTimeFormat(locale.startsWith('fr') ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCounterpartLabel(t: TranslationFn, viewerRole?: Role) {
  if (viewerRole === 'student') {
    return t('counterpart.instructor');
  }

  if (viewerRole === 'instructor') {
    return t('counterpart.student');
  }

  return t('counterpart.generic');
}

function SlotDetailsDialog({
  cancelling,
  locale,
  onOpenChange,
  onRequestCancel,
  open,
  pastSlotSelected,
  reviewablePastSlot,
  selectedSlotDetails,
  studentCancellationLocked,
  t,
  viewerRole,
}: {
  cancelling: boolean;
  locale: string;
  onOpenChange: (open: boolean) => void;
  onRequestCancel: () => void;
  open: boolean;
  pastSlotSelected: boolean;
  reviewablePastSlot: boolean;
  selectedSlotDetails: SelectedSlotDetails | null;
  studentCancellationLocked: boolean;
  t: TranslationFn;
  viewerRole?: Role;
}) {
  const slot = selectedSlotDetails?.slot ?? null;
  const counterpart = slot ? getCounterpartName(slot) : null;
  const counterpartLabel = getCounterpartLabel(t, viewerRole);
  const startLabel = slot ? formatTimeForLocale(slot.startTime, locale) : '';
  const endLabel = slot ? formatTimeForLocale(slot.endTime, locale) : '';
  const priceLabel =
    slot?.servicePrice != null
      ? formatServicePrice(slot.servicePrice)
      : null;
  const normalizedSlotId = normalizeSlotId(slot?.id);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewAvailable, setReviewAvailable] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [existingReviewId, setExistingReviewId] = useState<string | null>(null);

  const detailRows = slot
    ? [
        {
          label: t('slot.dialog.dateLabel'),
          value: selectedSlotDetails?.dateLabel ?? t('slot.dialog.noValue'),
        },
        {
          label: t('slot.dialog.timeLabel'),
          value: `${startLabel} - ${endLabel}`,
        },
        {
          label: counterpartLabel,
          value: counterpart ?? t('slot.dialog.noValue'),
        },
        {
          label: t('slot.serviceLabel'),
          value: slot.serviceName ?? t('slot.dialog.noValue'),
        },
        {
          label: t('slot.priceLabel'),
          value: priceLabel ?? t('slot.dialog.noValue'),
        },
        {
          label: t('slot.addressLabel'),
          value: slot.formattedAddress ?? t('slot.dialog.noValue'),
        },
      ]
    : [];

  useEffect(() => {
    if (!open || !reviewablePastSlot || !normalizedSlotId) {
      setReviewLoading(false);
      setReviewError(null);
      setReviewAvailable(true);
      setReviewRating(0);
      setReviewComment('');
      setExistingReviewId(null);
      return;
    }

    const controller = new AbortController();

    const loadReview = async () => {
      try {
        setReviewLoading(true);
        setReviewError(null);

        const response = await fetch(`/api/slots/${normalizedSlotId}/review`, {
          credentials: 'include',
          signal: controller.signal,
        });

        const body = await response.json().catch(() => null);

        if (!response.ok) {
          setReviewAvailable(true);
          setExistingReviewId(null);
          setReviewRating(0);
          setReviewComment('');
          return;
        }

        const review = body?.review as SlotReview | null | undefined;
        const canReview = body?.canReview !== false;

        setReviewAvailable(canReview);
        setExistingReviewId(review?.id ?? null);
        setReviewRating(typeof review?.rating === 'number' ? review.rating : 0);
        setReviewComment(typeof review?.comment === 'string' ? review.comment : '');
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }

        setReviewAvailable(true);
        setReviewError(null);
        setExistingReviewId(null);
        setReviewRating(0);
        setReviewComment('');
      } finally {
        if (!controller.signal.aborted) {
          setReviewLoading(false);
        }
      }
    };

    void loadReview();

    return () => {
      controller.abort();
    };
  }, [normalizedSlotId, open, reviewablePastSlot, t]);

  const handleSaveReview = async () => {
    if (!normalizedSlotId || reviewRating < 1 || reviewRating > 5) {
      setReviewError(t('slot.review.ratingRequired'));
      return;
    }

    try {
      setReviewSaving(true);
      setReviewError(null);

      const response = await fetch(`/api/slots/${normalizedSlotId}/review`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode =
          typeof body?.error === 'string' ? body.error : 'UNKNOWN_REVIEW_ERROR';
        const errorDetail =
          typeof body?.detail === 'string' && body.detail.trim().length > 0
            ? body.detail.trim()
            : '';

        if (errorCode === 'REVIEW_NOT_AVAILABLE_YET') {
          setReviewError(t('slot.review.notAvailableYet'));
          return;
        }

        if (errorCode === 'INVALID_REVIEW_RATING') {
          setReviewError(t('slot.review.ratingRequired'));
          return;
        }

        if (errorCode === 'REVIEWS_STORAGE_UNAVAILABLE') {
          setReviewError(
            errorDetail || t('slot.review.storageUnavailable'),
          );
          return;
        }

        setReviewError(t('slot.review.saveError'));
        return;
      }

      const review = body?.review as SlotReview | null | undefined;
      setExistingReviewId(review?.id ?? existingReviewId);
      setReviewComment(typeof review?.comment === 'string' ? review.comment : '');
      toast.success(
        existingReviewId
          ? t('slot.review.updateSuccess')
          : t('slot.review.submitSuccess'),
      );
    } catch (error) {
      setReviewError(t('slot.review.saveError'));
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('slot.dialog.title')}</DialogTitle>
          <DialogDescription>
            {slot
              ? t('slot.dialog.description', {
                  start: startLabel,
                  end: endLabel,
                })
              : t('slot.dialog.fallbackDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {detailRows.map((row) => (
            <div
              key={row.label}
              className="rounded-lg border bg-muted/30 px-4 py-3"
            >
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {row.label}
              </p>
              <p className="mt-1 text-sm text-foreground">{row.value}</p>
            </div>
          ))}
        </div>

        {reviewablePastSlot ? (
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{t('slot.review.title')}</h3>
              <p className="text-xs text-muted-foreground">
                {existingReviewId
                  ? t('slot.review.editHint')
                  : t('slot.review.description')}
              </p>
            </div>

            {reviewLoading ? (
              <div className="mt-4 space-y-3">
                <div className="h-5 w-40 animate-pulse rounded bg-muted" />
                <div className="h-24 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : reviewAvailable ? (
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= reviewRating;

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={t('slot.review.starAria', { count: value })}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition ${
                          active
                            ? 'border-amber-300 bg-amber-50 text-amber-600'
                            : 'border-border bg-background text-muted-foreground hover:border-amber-200 hover:text-amber-500'
                        }`}
                        onClick={() => setReviewRating(value)}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>

                <textarea
                  className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={2000}
                  onChange={(event) => setReviewComment(event.target.value)}
                  placeholder={t('slot.review.commentPlaceholder')}
                  value={reviewComment}
                />

                {reviewError ? (
                  <p className="text-xs text-red-600">{reviewError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t('slot.review.commentOptional')}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    disabled={reviewSaving}
                    onClick={() => void handleSaveReview()}
                    type="button"
                  >
                    {reviewSaving
                      ? t('slot.review.saving')
                      : existingReviewId
                        ? t('slot.review.updateAction')
                        : t('slot.review.submitAction')}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {reviewError ?? t('slot.review.unavailable')}
              </p>
            )}
          </div>
        ) : null}

        {studentCancellationLocked ? (
          <p className="text-sm text-muted-foreground">
            {t('slot.dialog.cancelWindowHint')}
          </p>
        ) : null}

        {!pastSlotSelected ? (
          <div className="flex justify-end pt-2">
            <Button
              disabled={!normalizeSlotId(slot?.id) || cancelling || studentCancellationLocked}
              onClick={onRequestCancel}
              type="button"
              variant="destructive"
            >
              {cancelling ? t('slot.dialog.cancelling') : t('slot.dialog.cancelAction')}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ConfirmCancelDialog({
  cancelling,
  onConfirm,
  onOpenChange,
  open,
  selectedSlotDetails,
  t,
}: {
  cancelling: boolean;
  onConfirm: () => Promise<void>;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedSlotDetails: SelectedSlotDetails | null;
  t: TranslationFn;
}) {
  const slot = selectedSlotDetails?.slot ?? null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('slot.dialog.confirmTitle')}</DialogTitle>
          <DialogDescription>
            {slot
              ? t('slot.dialog.confirmDescription', {
                  start: slot.startTime,
                  end: slot.endTime,
                })
              : t('slot.dialog.confirmFallback')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            disabled={cancelling}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            {t('slot.dialog.keepAction')}
          </Button>
          <Button
            disabled={cancelling}
            onClick={() => void onConfirm()}
            type="button"
            variant="destructive"
          >
            {cancelling ? t('slot.dialog.cancelling') : t('slot.dialog.confirmAction')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TravelBlock({
  locale,
  t,
  travel,
}: {
  locale: string;
  t: TranslationFn;
  travel: TravelSlot;
}) {
  const { top, height } = getTimelineBlockStyle(
    travel.startTime,
    travel.endTime,
    {
      startHour: START_HOUR,
      pixelsPerHour: PIXELS_PER_HOUR,
    }
  );

  const tooltipLines: string[] = [
    t('travel.tooltipTime', {
      start: formatTimeForLocale(travel.startTime, locale),
      end: formatTimeForLocale(travel.endTime, locale),
    }),
  ];

  if (travel.fromLabel) {
    tooltipLines.push(`${t('travel.from')} ${travel.fromLabel}`);
  }
  if (travel.toLabel) {
    tooltipLines.push(`${t('travel.to')} ${travel.toLabel}`);
  }

  const handleClick = () => {
    const url = buildTravelMapsUrl(travel);
    if (!url) {
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
      style={{ top, height, minHeight: '20px', zIndex: 5 }}
    >
      <div className="flex h-full flex-col items-start justify-center gap-0.5 px-1 py-0.5">
        <span className="truncate font-mono text-[9px] leading-tight">
          {formatTimeForLocale(travel.startTime, locale)} -{' '}
          {formatTimeForLocale(travel.endTime, locale)}
        </span>
        <span className="truncate text-[8px] uppercase tracking-wide opacity-80">
          {t('travel.label')}
        </span>
      </div>
    </button>
  );
}

function ReservedSlotBlock({
  locale,
  onClick,
  slot,
  t,
  viewerRole,
}: {
  locale: string;
  onClick: () => void;
  slot: Slot;
  t: TranslationFn;
  viewerRole?: Role;
}) {
  const { top, height } = getTimelineBlockStyle(slot.startTime, slot.endTime, {
    startHour: START_HOUR,
    pixelsPerHour: PIXELS_PER_HOUR,
  });
  const counterpart = getCounterpartName(slot);
  const startLabel = formatTimeForLocale(slot.startTime, locale);
  const endLabel = formatTimeForLocale(slot.endTime, locale);
  const isInstructorView = viewerRole === 'instructor';
  const priceLabel =
    isInstructorView && slot.servicePrice != null
      ? formatServicePrice(slot.servicePrice)
      : null;

  const tooltipLines: string[] = [`${startLabel}-${endLabel}`];

  if (counterpart) {
    tooltipLines.push(`${getCounterpartLabel(t, viewerRole)} : ${counterpart}`);
  }

  if (slot.serviceName) {
    const baseLabel = `${t('slot.serviceLabel')} ${slot.serviceName}`;
    tooltipLines.push(priceLabel ? `${baseLabel} (${priceLabel})` : baseLabel);
  } else if (priceLabel) {
    tooltipLines.push(`${t('slot.priceLabel')} ${priceLabel}`);
  }

  if (slot.formattedAddress) {
    tooltipLines.push(`${t('slot.addressLabel')} ${slot.formattedAddress}`);
  }

  tooltipLines.push(t('slot.dialog.openHint'));

  const contentLines: React.ReactNode[] = [
    <span key="time" className="truncate font-mono text-[9px] leading-tight">
      {startLabel} - {endLabel}
    </span>,
  ];

  if (counterpart) {
    contentLines.push(
      <span key="name" className="truncate text-[10px] font-medium leading-tight">
        {counterpart}
      </span>
    );
  }

  if (slot.serviceName) {
    contentLines.push(
      <span key="service" className="truncate text-[8px] leading-tight opacity-85">
        {slot.serviceName}
      </span>
    );
  }

  if (priceLabel) {
    contentLines.push(
      <span key="price" className="truncate text-[9px] leading-tight opacity-85">
        {priceLabel}
      </span>
    );
  }

  const maxLines = Math.max(
    1,
    Math.min(Math.floor((height - 4) / 11), contentLines.length)
  );

  return (
    <button
      type="button"
      aria-label={t('slot.dialog.ariaOpen')}
      className={`absolute left-1 right-1 rounded-md border text-left text-xs transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-offset-1 ${getSlotColorClass(
        slot,
        viewerRole
      )}`}
      onClick={onClick}
      style={{ top, height, minHeight: '24px', zIndex: 10 }}
      title={tooltipLines.join('\n')}
    >
      <div className="flex h-full flex-col items-start justify-center gap-0.5 px-1 py-0.5">
        {contentLines.slice(0, maxLines)}
      </div>
    </button>
  );
}
