'use client';

import { Trash2 } from 'lucide-react';
import {
  AvailabilityAgendaEntry,
  formatAvailabilityTooltip,
  getDurationColor,
} from '@/components/availability/availability-agenda-shared';
import {
  formatTimeForLocale,
  getAvailabilityBlockStyle,
} from '@/lib/client/utils/availability-time';

type AvailabilityAgendaSlotBlockProps = {
  availability: AvailabilityAgendaEntry;
  isEditing: boolean;
  locale: string;
  onDelete: (id: string) => void | Promise<void>;
  pixelsPerHour: number;
  startHour: number;
};

export function AvailabilityAgendaSlotBlock({
  availability,
  isEditing,
  locale,
  onDelete,
  pixelsPerHour,
  startHour,
}: AvailabilityAgendaSlotBlockProps) {
  const { top, height } = getAvailabilityBlockStyle(
    availability.startTime,
    availability.endTime,
    {
      startHour,
      pixelsPerHour,
    }
  );

  const colorClass = getDurationColor(
    availability.startTime,
    availability.endTime
  );

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border p-1.5 text-xs group transition-colors ${
        isEditing ? 'cursor-pointer' : 'cursor-default'
      } ${colorClass}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '24px',
      }}
      onClick={
        isEditing
          ? (event) => {
              event.stopPropagation();
              void onDelete(availability.id);
            }
          : undefined
      }
      title={formatAvailabilityTooltip(availability, locale)}
    >
      <div className="flex h-full items-start justify-between gap-1">
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="truncate text-[10px] font-medium leading-tight">
            {formatTimeForLocale(availability.startTime, locale)} -{' '}
            {formatTimeForLocale(availability.endTime, locale)}
          </div>
        </div>

        {isEditing && (
          <Trash2 className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </div>
    </div>
  );
}
