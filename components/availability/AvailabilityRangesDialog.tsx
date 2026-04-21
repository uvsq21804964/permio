'use client';

import type React from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_AVAILABILITY_MAX_MINUTES,
  DEFAULT_AVAILABILITY_MINUTES,
  DEFAULT_AVAILABILITY_STEP_MINUTES,
  formatTimeForLocale,
  timeToMinutes,
} from '@/lib/client/utils/availability-time';
import type { AvailabilityTimeRange } from '@/lib/client/utils/availability-editor';
import { TimeSelect5mLocale } from '@/components/availability/TimeSelect5mLocale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TranslateFn = (key: string, values?: Record<string, unknown>) => string;

type AvailabilityRangesDialogProps = {
  dayLabel: string;
  error: string;
  locale: string;
  onAddRange: () => void;
  onEndTimeChange: (index: number, nextEndTime: string) => void;
  onOpenChange: (open: boolean) => void;
  onRemoveRange: (index: number) => void;
  onStartTimeChange: (index: number, nextStartTime: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  open: boolean;
  rangeRowClassName?: string;
  t: TranslateFn;
  timeRanges: AvailabilityTimeRange[];
};

export function AvailabilityRangesDialog({
  dayLabel,
  error,
  locale,
  onAddRange,
  onEndTimeChange,
  onOpenChange,
  onRemoveRange,
  onStartTimeChange,
  onSubmit,
  open,
  rangeRowClassName = 'flex items-center gap-2 rounded-lg border p-3',
  t,
  timeRanges,
}: AvailabilityRangesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('dialog.dayLabel')}</Label>
            <Input value={dayLabel} disabled />
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('dialog.rangesLabel')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddRange}
              >
                <Plus className="mr-1 h-4 w-4" />
                {t('buttons.addSlot')}
              </Button>
            </div>

            {timeRanges.map((range, index) => {
              const startMax =
                DEFAULT_AVAILABILITY_MAX_MINUTES -
                DEFAULT_AVAILABILITY_STEP_MINUTES;
              const startMin = DEFAULT_AVAILABILITY_MINUTES;
              const startMinutes = timeToMinutes(range.startTime);
              const endMin = Math.min(
                startMinutes + DEFAULT_AVAILABILITY_STEP_MINUTES,
                DEFAULT_AVAILABILITY_MAX_MINUTES
              );

              return (
                <div key={index} className={rangeRowClassName}>
                  <div className="grid flex-1 grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t('dialog.startLabel')}</Label>

                      <TimeSelect5mLocale
                        id={`start-${index}`}
                        locale={locale}
                        value={range.startTime}
                        minMinutes={startMin}
                        maxMinutes={startMax}
                        stepMinutes={DEFAULT_AVAILABILITY_STEP_MINUTES}
                        onChange={(nextStartTime) =>
                          onStartTimeChange(index, nextStartTime)
                        }
                      />

                      <div className="text-[11px] text-muted-foreground">
                        {formatTimeForLocale(range.startTime, locale)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">{t('dialog.endLabel')}</Label>

                      <TimeSelect5mLocale
                        id={`end-${index}`}
                        locale={locale}
                        value={range.endTime}
                        minMinutes={endMin}
                        maxMinutes={DEFAULT_AVAILABILITY_MAX_MINUTES}
                        stepMinutes={DEFAULT_AVAILABILITY_STEP_MINUTES}
                        onChange={(nextEndTime) =>
                          onEndTimeChange(index, nextEndTime)
                        }
                      />

                      <div className="text-[11px] text-muted-foreground">
                        {formatTimeForLocale(range.endTime, locale)}
                      </div>
                    </div>
                  </div>

                  {timeRanges.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveRange(index)}
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('buttons.cancel')}
            </Button>
            <Button type="submit">{t('buttons.submit')}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
