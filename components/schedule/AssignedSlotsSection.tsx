// components/schedule/AssignedSlotsSection.tsx
'use client';

import { useMemo } from 'react';
import type { ScheduleResult } from '@/types/schedule';
import { groupMatches } from '@/lib/schedule-utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { MemberScheduleList } from './MemberScheduleList';

export function AssignedSlotsSection({ result }: { result: ScheduleResult }) {
  const byStudent = useMemo(
    () => groupMatches(result.matches, 'studentId', 'studentName'),
    [result.matches]
  );
  const byInstructor = useMemo(
    () => groupMatches(result.matches, 'instructorId', 'instructorName'),
    [result.matches]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Créneaux par membre (assignés)</CardTitle>
        <CardDescription>
          Visualisez, pour chaque élève et moniteur, les créneaux attribués par
          l’optimiseur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result.matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun créneau attribué pour l’instant.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <MemberScheduleList
              title="Élèves"
              groups={byStudent}
              renderRow={(m) => ({
                left: `${m.startTime}–${m.endTime}`,
                right: `avec ${m.instructorName}`,
                duration: m.duration,
              })}
            />
            <MemberScheduleList
              title="Moniteurs"
              groups={byInstructor}
              renderRow={(m) => ({
                left: `${m.startTime}–${m.endTime}`,
                right: `avec ${m.studentName}`,
                duration: m.duration,
              })}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
