'use client';

import {
  formatDayAndDate,
  formatTimeForLocale,
  type SelectedBookingService,
  type SelectedBookingSlot,
} from '@/components/booking/booking-page-shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  computeServiceTimes,
  type ServiceAlignment,
} from '@/lib/client/utils/booking';

type BookingAlignmentDialogProps = {
  alignmentChoice: ServiceAlignment;
  locale: string;
  onAlignmentChoiceChange: (value: ServiceAlignment) => void;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedService: SelectedBookingService | null;
  selectedSlot: SelectedBookingSlot | null;
  t: (key: string, values?: Record<string, unknown>) => string;
};

export function BookingAlignmentDialog({
  alignmentChoice,
  locale,
  onAlignmentChoiceChange,
  onConfirm,
  onOpenChange,
  open,
  selectedService,
  selectedSlot,
  t,
}: BookingAlignmentDialogProps) {
  const duration = selectedService?.durationMinutes ?? null;
  const canAlign = Boolean(selectedSlot) && Boolean(duration);

  const startAligned =
    canAlign && selectedSlot && duration
      ? computeServiceTimes(
          selectedSlot.windowStartTime,
          selectedSlot.windowEndTime,
          duration,
          'start'
        )
      : null;

  const endAligned =
    canAlign && selectedSlot && duration
      ? computeServiceTimes(
          selectedSlot.windowStartTime,
          selectedSlot.windowEndTime,
          duration,
          'end'
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {canAlign && selectedSlot && startAligned && endAligned ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('alignmentModal.title')}</DialogTitle>
              <DialogDescription>
                {t('alignmentModal.description')}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
              <p>
                {t('alignmentModal.dateLabel', {
                  value: formatDayAndDate(selectedSlot.date, locale),
                })}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border p-3 text-left text-sm transition hover:border-primary hover:bg-muted ${
                  alignmentChoice === 'start'
                    ? 'border-primary bg-muted'
                    : 'border-border'
                }`}
                onClick={() => onAlignmentChoiceChange('start')}
              >
                <div className="font-medium text-sm">
                  {t('alignmentModal.alignStartTitle')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('alignmentModal.alignStartBody', {
                    start: formatTimeForLocale(startAligned.serviceStartTime, locale),
                    end: formatTimeForLocale(startAligned.serviceEndTime, locale),
                  })}
                </p>
              </button>

              <button
                type="button"
                className={`rounded-lg border p-3 text-left text-sm transition hover:border-primary hover:bg-muted ${
                  alignmentChoice === 'end'
                    ? 'border-primary bg-muted'
                    : 'border-border'
                }`}
                onClick={() => onAlignmentChoiceChange('end')}
              >
                <div className="font-medium text-sm">
                  {t('alignmentModal.alignEndTitle')}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('alignmentModal.alignEndBody', {
                    start: formatTimeForLocale(endAligned.serviceStartTime, locale),
                    end: formatTimeForLocale(endAligned.serviceEndTime, locale),
                  })}
                </p>
              </button>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t('buttons.cancel')}
              </Button>
              <Button size="sm" onClick={onConfirm}>
                {t('buttons.confirm')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('alignmentModal.fallbackTitle')}</DialogTitle>
              <DialogDescription>
                {t('alignmentModal.fallbackDescription')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                {t('buttons.close')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
