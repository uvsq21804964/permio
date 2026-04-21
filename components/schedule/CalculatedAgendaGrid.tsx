'use client';

import { Match, DAYS, HOURS, PARTNER_PALETTE, PIXELS_PER_HOUR, ScheduleUser, START_HOUR, partnerKeyFromIdName } from '@/components/schedule/calculated-agenda-shared';
import {
  getStablePaletteClass,
  getTimelineBlockStyle,
} from '@/lib/client/utils/schedule-display';

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
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-0">
          <div className="border-b p-2 text-sm font-medium text-muted-foreground">
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

        <div className="grid grid-cols-8 gap-0">
          <div>
            {HOURS.map((hour) => (
              <div
                key={`hour-${hour}`}
                className="border-b border-r p-2 text-sm text-muted-foreground"
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
                  className="border-b"
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
