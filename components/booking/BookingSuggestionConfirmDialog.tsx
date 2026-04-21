'use client';

import { buildSuggestionTimeRange, formatSuggestionDate, type SuggestedBookingSlot } from '@/components/booking/booking-proposals-shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BookingSuggestionConfirmDialogProps = {
  loading: boolean;
  locale: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  slot: SuggestedBookingSlot | null;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function BookingSuggestionConfirmDialog({
  loading,
  locale,
  onConfirm,
  onOpenChange,
  open,
  slot,
  t,
}: BookingSuggestionConfirmDialogProps) {
  const timeLabel = slot ? buildSuggestionTimeRange(slot, locale) : null;
  const dateLabel = slot ? formatSuggestionDate(slot.date, locale) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('confirm.title')}</DialogTitle>
          <DialogDescription>
            {slot && timeLabel && dateLabel
              ? t('confirm.body', {
                  date: dateLabel,
                  time: timeLabel,
                })
              : t('confirm.fallback')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('confirm.cancel')}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? t('booking.loading') : t('confirm.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
