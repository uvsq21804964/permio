// components/schedule/DayBlock.tsx
'use client';

import { DAYS } from '@/types/schedule';

export function DayBlock({
  day,
  children,
}: {
  day: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-muted-foreground">
        {DAYS[day]}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
