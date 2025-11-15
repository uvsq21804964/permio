// components/MatchesCard.tsx
'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

export type MatchItem = {
  studentName: string;
  instructorName: string;
  dayOfWeek: number; // 0 = Lundi ... 6 = Dimanche
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  duration: number; // en minutes
};

type MatchesCardProps = {
  matches: MatchItem[];
  title?: string;
  emptyText?: string;
  badgeText?: string;
};

export default function MatchesCard({
  matches,
  title = 'Correspondances trouvées',
  emptyText = 'Aucune correspondance trouvée',
  badgeText = 'Disponible',
}: MatchesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{matches.length} cours planifiés</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">{emptyText}</p>
          ) : (
            matches.map((match, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{match.studentName}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{match.instructorName}</span>
                  </div>

                  <p className="text-muted-foreground text-sm">
                    {DAYS[match.dayOfWeek]} • {match.startTime} -{' '}
                    {match.endTime} ({match.duration} min)
                  </p>
                </div>

                <Badge variant="default">{badgeText}</Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
