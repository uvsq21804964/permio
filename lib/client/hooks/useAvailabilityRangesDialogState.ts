'use client';

import { useState } from 'react';
import {
  appendEmptyTimeRange,
  createEmptyTimeRange,
  createInitialTimeRangeForHour,
  getAdjustedRangeAfterStartChange,
  removeTimeRangeAt,
  type AvailabilityTimeRange,
} from '@/lib/client/utils/availability-editor';

export function useAvailabilityRangesDialogState() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<AvailabilityTimeRange[]>([
    createEmptyTimeRange(),
  ]);

  const openForCell = (day: number, hour: number) => {
    setSelectedDay(day);
    setTimeRanges([createInitialTimeRangeForHour(hour)]);
    setDialogOpen(true);
  };

  const resetRanges = () => {
    setTimeRanges([createEmptyTimeRange()]);
  };

  const addTimeRange = () => {
    setTimeRanges((previous) => appendEmptyTimeRange(previous));
  };

  const removeTimeRange = (index: number) => {
    setTimeRanges((previous) => removeTimeRangeAt(previous, index));
  };

  const updateStartTime = (index: number, nextStartTime: string) => {
    setTimeRanges((previous) => {
      const next = [...previous];
      next[index] = getAdjustedRangeAfterStartChange(next[index], nextStartTime);
      return next;
    });
  };

  const updateEndTime = (index: number, nextEndTime: string) => {
    setTimeRanges((previous) => {
      const next = [...previous];
      next[index] = { ...next[index], endTime: nextEndTime };
      return next;
    });
  };

  return {
    addTimeRange,
    dialogOpen,
    openForCell,
    removeTimeRange,
    resetRanges,
    selectedDay,
    setDialogOpen,
    timeRanges,
    updateEndTime,
    updateStartTime,
  };
}
