'use client';

import { Match, DAYS, HOURS, PARTNER_PALETTE, PIXELS_PER_HOUR, ScheduleUser, START_HOUR, partnerKeyFromIdName } from '@/components/schedule/calculated-agenda-shared';
import {
  getStablePaletteClass,
  getTimelineBlockStyle,
} from '@/lib/client/utils/schedule-display';
import { isOutsideDefaultWorkingHours } from '@/lib/client/utils/working-hours';

type CalculatedAgendaGridProps = {
  items: Match[];
  itemsByDay: Map<number, Match[]>;
  selectedUser: ScheduleUser | null;
  selectedUserId: string;
};

export function CalculatedAgendaGrid({
  items,
  itemsByDay,
  selectedUser,
  selectedUserId,
}: CalculatedAgendaGridProps) {
  if (!selectedUserId) {
    return (
      <p className="text-sm text-muted-foreground">
        Selectionnez un membre pour voir son agenda.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun créneau attribué pour {selectedUser?.name ?? selectedUserId}.
      </p>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-auto">
      <div className="min-w-[800px]">
        <div className="sticky top-0 z-20 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:grid-cols-8">
          <div className="sticky left-0 z-30 border-b bg-background/95 px-1 py-2 text-[11px] font-medium text-muted-foreground backdrop-blur supports-[backdrop-filter]:bg-background/80 md:p-2 md:text-sm">
            Heure
          </div>
          {DAYS.map((day) => (
            <div
              key={day}
              className="border-b border-r p-2 text-center text-sm font-medium"
            >
              {day}
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
                {hour}:00
              </div>
            ))}
          </div>

          {DAYS.map((_, dayIndex) => (
            <div key={`day-${dayIndex}`} className="relative border-r">
              {HOURS.map((hour) => (
                <div
                  key={`${dayIndex}-${hour}`}
                  className={isOutsideDefaultWorkingHours(hour) ? 'border-b bg-slate-100/70' : 'border-b'}
                  style={{ height: `${PIXELS_PER_HOUR}px` }}
                />
              ))}

              {(itemsByDay.get(dayIndex) ?? []).map((match, index) => (
                <AgendaMatchBlock
                  key={`${dayIndex}-${index}`}
                  match={match}
                  selectedUserId={selectedUserId}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgendaMatchBlock({
  match,
  selectedUserId,
}: {
  match: Match;
  selectedUserId: string;
}) {
  const { top, height } = getTimelineBlockStyle(
    match.startTime,
    match.endTime,
    {
      startHour: START_HOUR,
      pixelsPerHour: PIXELS_PER_HOUR,
    }
  );

  const isStudentView = match.studentId === selectedUserId;
  const partnerId = isStudentView ? match.instructorId : match.studentId;
  const partnerName = isStudentView ? match.instructorName : match.studentName;
  const colorClass = getStablePaletteClass(
    partnerKeyFromIdName(partnerId, partnerName),
    PARTNER_PALETTE
  );

  return (
    <div
      className={`absolute left-1 right-1 rounded-md border p-2 text-xs ${colorClass}`}
      style={{ top, height, minHeight: '24px' }}
      title={`${match.startTime}-${match.endTime} avec ${partnerName}`}
    >
      <div className="flex h-full items-start justify-between gap-1">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-medium leading-tight">
            {match.startTime} - {match.endTime}
          </div>
          <div className="truncate text-[10px] text-muted-foreground">
            avec {partnerName}
          </div>
        </div>
      </div>
    </div>
  );
}
