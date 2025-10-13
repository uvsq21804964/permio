// components/schedule/MemberScheduleList.tsx
'use client';

import type { Match } from '@/types/schedule';
import { Badge } from '@/components/ui/badge';
import { DayBlock } from './DayBlock';
import { SlotRow } from './SlotRow';
import { groupByDay } from '@/lib/schedule-utils';

export function MemberScheduleList({
  title,
  groups,
  renderRow,
}: {
  title: string;
  groups: Map<string, { name: string; items: Match[] }>;
  renderRow: (m: Match) => { left: string; right: string; duration: number };
}) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {groups.size === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun créneau.</p>
      ) : (
        Array.from(groups.entries()).map(([id, info]) => (
          <details
            key={id}
            className="mb-3 rounded-lg border p-3 open:bg-muted/30 transition-colors"
          >
            <summary className="flex items-center justify-between cursor-pointer">
              <span className="font-medium truncate">{info.name}</span>
              <Badge variant="secondary">{info.items.length} créneau(x)</Badge>
            </summary>

            <div className="mt-3 space-y-3">
              {groupByDay(info.items).map(([day, list]) => (
                <DayBlock key={`${id}-${day}`} day={day}>
                  {list.map((m, i) => {
                    const { left, right, duration } = renderRow(m);
                    return (
                      <SlotRow
                        key={`${id}-${day}-${i}`}
                        left={left}
                        right={right}
                        duration={duration}
                      />
                    );
                  })}
                </DayBlock>
              ))}
            </div>
          </details>
        ))
      )}
    </div>
  );
}
