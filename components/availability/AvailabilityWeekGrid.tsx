'use client';

import type React from 'react';
import { isOutsideDefaultWorkingHours } from '@/lib/client/utils/working-hours';

type AvailabilityWeekGridProps = {
  dayColumnClassName?: string;
  dayHeaderClassName?: string;
  dayLabels: string[];
  getCellClassName?: (dayIndex: number, hour: number) => string;
  gridClassName?: string;
  hourCellClassName?: string;
  hourColumnClassName?: string;
  hourColumnTitle: React.ReactNode;
  hourHeaderClassName?: string;
  hours: number[];
  minWidthClassName?: string;
  onCellClick?: (dayIndex: number, hour: number) => void;
  pixelsPerHour: number;
  renderBlocks: (dayIndex: number) => React.ReactNode;
  renderHourLabel: (hour: number) => React.ReactNode;
};

export function AvailabilityWeekGrid({
  dayColumnClassName = 'relative border-r',
  dayHeaderClassName = 'p-2 text-center text-sm font-medium border-b border-r',
  dayLabels,
  getCellClassName,
  gridClassName = 'grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-0 md:grid-cols-8',
  hourCellClassName = 'border-r border-b px-1 py-2 text-[11px] text-muted-foreground md:p-2 md:text-sm',
  hourColumnClassName = '',
  hourColumnTitle,
  hourHeaderClassName = 'border-b px-1 py-2 text-[11px] font-medium text-muted-foreground md:p-2 md:text-sm',
  hours,
  minWidthClassName = 'min-w-[800px]',
  onCellClick,
  pixelsPerHour,
  renderBlocks,
  renderHourLabel,
}: AvailabilityWeekGridProps) {
  return (
    <div className="max-h-[70vh] overflow-auto">
      <div className={minWidthClassName}>
        <div
          className={`sticky top-0 z-20 ${gridClassName} bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80`}
        >
          <div
            className={`sticky left-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 ${hourHeaderClassName}`}
          >
            {hourColumnTitle}
          </div>
          {dayLabels.map((label, index) => (
            <div key={index} className={dayHeaderClassName}>
              {label}
            </div>
          ))}
        </div>

        <div className={gridClassName}>
          <div className={`sticky left-0 z-10 bg-background ${hourColumnClassName}`.trim()}>
            {hours.map((hour) => (
              <div
                key={`hour-${hour}`}
                className={`${hourCellClassName} ${
                  isOutsideDefaultWorkingHours(hour)
                    ? 'bg-slate-100/70'
                    : 'bg-background'
                }`.trim()}
                style={{ height: `${pixelsPerHour}px` }}
              >
                {renderHourLabel(hour)}
              </div>
            ))}
          </div>

          {dayLabels.map((_, dayIndex) => (
            <div key={`day-${dayIndex}`} className={dayColumnClassName}>
              {hours.map((hour) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={`${
                    getCellClassName?.(dayIndex, hour) ?? 'border-b'
                  } ${isOutsideDefaultWorkingHours(hour) ? 'bg-slate-100/70' : ''}`.trim()}
                  style={{ height: `${pixelsPerHour}px` }}
                  onClick={
                    onCellClick ? () => onCellClick(dayIndex, hour) : undefined
                  }
                />
              ))}

              {renderBlocks(dayIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
