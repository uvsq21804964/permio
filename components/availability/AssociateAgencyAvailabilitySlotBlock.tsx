'use client';

import { Trash2 } from 'lucide-react';
import {
  AssociateAgencyAvailabilityEntry,
  formatAssociateAvailabilityTooltip,
  getAssociateAvailabilityBlockColor,
} from '@/components/availability/associate-agency-availability-shared';
import { formatTimeForLocale, getAvailabilityBlockStyle } from '@/lib/client/utils/availability-time';

type AssociateAgencyAvailabilitySlotBlockProps = {
  availability: AssociateAgencyAvailabilityEntry;
  locale: string;
  onDelete: (availability: AssociateAgencyAvailabilityEntry) => void;
  pixelsPerHour: number;
  startHour: number;
};

export function AssociateAgencyAvailabilitySlotBlock({
  availability,
  locale,
  onDelete,
  pixelsPerHour,
  startHour,
}: AssociateAgencyAvailabilitySlotBlockProps) {
  const { top, height } = getAvailabilityBlockStyle(
    availability.startTime,
    availability.endTime,
    {
      startHour,
      pixelsPerHour,
    }
  );

  return (
    <div
      className={[
        'absolute left-1 right-1 rounded-xl border px-2 py-1 text-[11px]',
        'group shadow-[0_10px_25px_rgba(0,0,0,0.08)]',
        getAssociateAvailabilityBlockColor(availability),
      ].join(' ')}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '26px',
      }}
      title={formatAssociateAvailabilityTooltip(availability, locale)}
    >
      <div className="flex h-full items-center justify-between gap-2">
        <div className="truncate font-semibold">
          {formatTimeForLocale(availability.startTime, locale)} -{' '}
          {formatTimeForLocale(availability.endTime, locale)}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete(availability);
          }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
