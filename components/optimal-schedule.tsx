// components/optimal-schedule.tsx
'use client';

import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Calendar, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { ScheduleResult } from '@/types/schedule';
import { AssignedSlotsSection } from '@/components/schedule/AssignedSlotsSection';
import { CalculatedAgendaSection } from '@/components/schedule/CalculatedAgendaSection';
import { useAuth, useOrganization } from '@clerk/nextjs';
import StudentsAvailabilityHeatmap from './gestion/StudentsAvailabilityHeatmap';

type Role = 'student' | 'instructor' | 'admin';
type Student = { id: string; name: string | null };

export function OptimalSchedule() {
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { orgId: authOrgId } = useAuth();
  const { organization } = useOrganization();
  const orgId = organization?.id ?? authOrgId ?? '';
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsErr, setStudentsErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStudentsErr(null);
        const res = await fetch('/api/users?role=student', {
          credentials: 'include',
          headers: orgId ? { 'x-org-id': orgId } : {},
        });
        if (!res.ok)
          throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
        const data = await res.json();
        const list: Array<{ id: string; name: string | null; role: string }> =
          Array.isArray(data) ? data : data?.data ?? [];
        const mapped = list
          .filter((u) => u.role === 'student')
          .map((u) => ({ id: u.id, name: u.name ?? 'Élève sans nom' }));
        if (!cancelled) setStudents(mapped);
      } catch (e: any) {
        console.error('[OptimalSchedule] /api/users?role=student failed', e);
        if (!cancelled) {
          setStudents([]);
          setStudentsErr(e?.message ?? 'Erreur de chargement des élèves');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const handleGenerateSchedule = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        credentials: 'include',
        headers: orgId ? { 'x-org-id': orgId } : {},
      });
      const data = await response.json();

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
          <CardTitle>Générer la configuration</CardTitle>
          <CardDescription>
            Lancez l&apos;algorithme d&apos;optimisation pour attribuer
            automatiquement les créneaux aux élèves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateSchedule} disabled={loading} size="lg">
            <Sparkles className="mr-2 h-5 w-5" />
            {loading
              ? 'Génération en cours...'
              : 'Générer la configuration optimale'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Statistiques */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Élèves total
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
                  Élèves assignés
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

          {/* Élèves non assignés */}
          {result.unmatchedStudents?.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  {result.unmatchedStudents?.length} élève(s) non assigné(s):
                </strong>{' '}
                {result.unmatchedStudents?.map((s) => s.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Nouvelle section décomposée en composants */}
          <AssignedSlotsSection result={result} />
          {/* <MatchesCard matches={result.matches} /> */}
          <CalculatedAgendaSection result={result} />
          <StudentsAvailabilityHeatmap students={students} />
        </>
      )}
    </div>
  );
}
