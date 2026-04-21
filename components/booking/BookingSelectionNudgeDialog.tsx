'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildSuggestionTimeRange, type SuggestedBookingSlot } from '@/components/booking/booking-proposals-shared';

type BookingSelectionNudgeDialogProps = {
  alternativeSlot: SuggestedBookingSlot | null;
  currentSlot: SuggestedBookingSlot | null;
  locale: string;
  onKeepChoice: () => void;
  onOpenChange: (open: boolean) => void;
  onSwitchToAlternative: () => void;
  open: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function BookingSelectionNudgeDialog({
  alternativeSlot,
  currentSlot,
  locale,
  onKeepChoice,
  onOpenChange,
  onSwitchToAlternative,
  open,
  t,
}: BookingSelectionNudgeDialogProps) {
  const currentLabel = currentSlot
    ? buildSuggestionTimeRange(currentSlot, locale)
    : null;
  const alternativeLabel = alternativeSlot
    ? buildSuggestionTimeRange(alternativeSlot, locale)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('nudge.title')}</DialogTitle>
          <DialogDescription>
            {currentLabel && alternativeLabel
              ? t('nudge.body', {
                  current: currentLabel,
                  alternative: alternativeLabel,
                })
              : t('nudge.fallback')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onKeepChoice}>
            {t('nudge.keepChoice')}
          </Button>
          <Button onClick={onSwitchToAlternative}>
            {alternativeLabel
              ? t('nudge.switchChoice', { time: alternativeLabel })
              : t('nudge.switchDefault')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
