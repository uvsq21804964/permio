// components/optimal-schedule.tsx
'use client';

import { useMemo, useState } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { Sparkles, Users, Calendar, AlertCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { ScheduleResult } from '@/types/schedule';
import { AssignedSlotsSection } from '@/components/schedule/AssignedSlotsSection';
import { CalculatedAgendaSection } from '@/components/schedule/CalculatedAgendaSection';
import StudentsAvailabilityHeatmap from './gestion/StudentsAvailabilityHeatmap';
import { generateSchedule } from '@/lib/client/api/schedule-client';
import { useAgencyUsers } from '@/lib/client/hooks/useAgencyUsers';

type Student = { id: string; name: string | null };

export function OptimalSchedule() {
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { orgId: authOrgId } = useAuth();
  const { organization } = useOrganization();
  const orgId = organization?.id ?? authOrgId ?? '';

  const { users: agencyStudents, error: studentsErr } = useAgencyUsers({
    enabled: !!orgId,
    orgId,
    role: 'student',
    loadErrorMessage: 'Erreur de chargement des eleves',
  });

  const students = useMemo<Student[]>(
    () =>
      agencyStudents
        .filter((user) => user.role === 'student')
        .map((user) => ({
          id: user.id,
          name: user.name ?? 'Eleve sans nom',
        })),
    [agencyStudents]
  );

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const data = await generateSchedule<ScheduleResult>({
        orgId,
        fallbackMessage: 'Erreur lors de la generation du planning',
      });
      setResult(data);
    } catch (error) {
      console.error('[v0] Error generating schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generer la configuration</CardTitle>
          <CardDescription>
            Lancez l&apos;algorithme d&apos;optimisation pour attribuer
            automatiquement les créneaux aux élèves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateSchedule} disabled={loading} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            {loading
              ? 'Generation en cours...'
              : 'Generer la configuration optimale'}
          </Button>
        </CardContent>
      </Card>

      {studentsErr && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{studentsErr}</AlertDescription>
        </Alert>
      )}

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Eleves total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {result.stats?.totalStudents}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Eleves assignes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">
                    {result.stats?.matchedStudents}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Moniteurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">
                    {result.stats?.totalInstructors}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Correspondances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">
                    {result.stats?.totalMatches}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {result.unmatchedStudents?.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  {result.unmatchedStudents.length} eleve(s) non assigne(s):
                </strong>{' '}
                {result.unmatchedStudents.map((student) => student.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          <AssignedSlotsSection result={result} />
          <CalculatedAgendaSection result={result} />
          <StudentsAvailabilityHeatmap students={students} />
        </>
      )}
    </div>
  );
}
