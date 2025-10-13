// components/schedule/SlotRow.tsx
'use client';

import { Badge } from '@/components/ui/badge';

export function SlotRow({
  left,
  right,
  duration,
}: {
  left: string;
  right: string;
  duration: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <div className="text-sm">
        {left}
        <span className="text-muted-foreground"> • </span>
        {right}
      </div>
      <Badge variant="outline">{duration} min</Badge>
    </div>
  );
}
