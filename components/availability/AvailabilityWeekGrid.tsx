'use client';

import type React from 'react';

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
  gridClassName = 'grid grid-cols-8 gap-0',
  hourCellClassName = 'p-2 text-sm text-muted-foreground border-r border-b',
  hourColumnClassName = '',
  hourColumnTitle,
  hourHeaderClassName = 'p-2 text-sm font-medium text-muted-foreground border-b',
  hours,
  minWidthClassName = 'min-w-[800px]',
  onCellClick,
  pixelsPerHour,
  renderBlocks,
  renderHourLabel,
}: AvailabilityWeekGridProps) {
  return (
    <div className={minWidthClassName}>
      <div className={gridClassName}>
        <div className={hourHeaderClassName}>{hourColumnTitle}</div>
        {dayLabels.map((label, index) => (
          <div key={index} className={dayHeaderClassName}>
            {label}
          </div>
        ))}
      </div>

      <div className={gridClassName}>
        <div className={hourColumnClassName}>
          {hours.map((hour) => (
            <div
              key={`hour-${hour}`}
              className={hourCellClassName}
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
                className={getCellClassName?.(dayIndex, hour) ?? 'border-b'}
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
  );
}
