'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { deleteAgencyUser } from '@/lib/client/api/users-client';
import { useAgencyUsers } from '@/lib/client/hooks/useAgencyUsers';
import { useCommitSchedule } from '@/lib/client/hooks/useCommitSchedule';
import { CalculatedAgendaGrid } from '@/components/schedule/CalculatedAgendaGrid';
import { CalculatedAgendaPartnersLegend } from '@/components/schedule/CalculatedAgendaPartnersLegend';
import {
  Match,
  PARTNER_PALETTE,
  ScheduleResult,
  ScheduleUser,
  partnerKeyFromIdName,
} from '@/components/schedule/calculated-agenda-shared';
import { getStablePaletteClass } from '@/lib/client/utils/schedule-display';

export function CalculatedAgendaSection({
  result,
  orgId,
}: {
  result: ScheduleResult;
  orgId?: string;
}) {
  const [users, setUsers] = useState<ScheduleUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [matchesLocal, setMatchesLocal] = useState<Match[]>(result.matches || []);
  const [msg, setMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { loading: commitLoading, saveSchedule } = useCommitSchedule({
    orgId,
    errorMessage: 'Failed to commit schedule',
  });
  const { users: agencyUsers } = useAgencyUsers({
    orgId,
    loadErrorMessage: 'users fetch failed',
  });

  useEffect(() => {
    setMatchesLocal(result.matches || []);
  }, [result.matches]);

  useEffect(() => {
    if (agencyUsers.length > 0) {
      setUsers(
        agencyUsers.map((user) => ({
          id: user.id,
          name: user.name ?? user.id,
          role: user.role,
        }))
      );
    }
  }, [agencyUsers]);

  const derivedUsers = useMemo<ScheduleUser[]>(() => {
    if (users.length > 0) {
      return users;
    }

    const usersById = new Map<string, ScheduleUser>();
    for (const match of matchesLocal) {
      if (!usersById.has(match.studentId)) {
        usersById.set(match.studentId, {
          id: match.studentId,
          name: match.studentName,
          role: 'student',
        });
      }
      if (!usersById.has(match.instructorId)) {
        usersById.set(match.instructorId, {
          id: match.instructorId,
          name: match.instructorName,
          role: 'instructor',
        });
      }
    }

    return Array.from(usersById.values());
  }, [matchesLocal, users]);

  useEffect(() => {
    if (!selectedUserId && derivedUsers.length > 0) {
      setSelectedUserId(derivedUsers[0].id);
    }
  }, [derivedUsers, selectedUserId]);

  const items = useMemo(() => {
    if (!selectedUserId) {
      return [] as Match[];
    }

    return matchesLocal.filter(
      (match) =>
        match.studentId === selectedUserId ||
        match.instructorId === selectedUserId
    );
  }, [matchesLocal, selectedUserId]);

  const itemsByDay = useMemo(() => {
    const itemsMap = new Map<number, Match[]>();
    for (const item of items) {
      if (!itemsMap.has(item.dayOfWeek)) {
        itemsMap.set(item.dayOfWeek, []);
      }
      itemsMap.get(item.dayOfWeek)!.push(item);
    }

    for (const values of itemsMap.values()) {
      values.sort((left, right) => left.startTime.localeCompare(right.startTime));
    }

    return itemsMap;
  }, [items]);

  const selectedUser = useMemo(
    () => derivedUsers.find((user) => user.id === selectedUserId) ?? null,
    [derivedUsers, selectedUserId]
  );

  const partnerLegend = useMemo(() => {
    const partnersByKey = new Map<
      string,
      {
        id: string;
        label: string;
        klass: string;
        role: 'student' | 'instructor';
      }
    >();

    for (const item of items) {
      const isStudent = item.studentId === selectedUserId;
      const partnerId = isStudent ? item.instructorId : item.studentId;
      const partnerName = isStudent ? item.instructorName : item.studentName;
      const partnerRole: 'student' | 'instructor' = isStudent
        ? 'instructor'
        : 'student';
      const partnerKey = partnerKeyFromIdName(partnerId, partnerName);

      if (!partnersByKey.has(partnerKey)) {
        partnersByKey.set(partnerKey, {
          id: partnerId || partnerKey,
          label: partnerName || partnerKey,
          klass: getStablePaletteClass(partnerKey, PARTNER_PALETTE),
          role: partnerRole,
        });
      }
    }

    return Array.from(partnersByKey.values());
  }, [items, selectedUserId]);

  async function deleteStudent(studentId: string) {
    setMsg(null);

    try {
      setDeletingId(studentId);
      await deleteAgencyUser(studentId, {
        orgId,
        fallbackMessage: 'Failed to delete user',
      });

      setUsers((previous) => previous.filter((user) => user.id !== studentId));
      setMatchesLocal((previous) =>
        previous.filter((match) => match.studentId !== studentId)
      );
      setSelectedUserId((previous) =>
        previous === studentId
          ? derivedUsers.find((user) => user.id !== studentId)?.id || ''
          : previous
      );
      setMsg('Eleve supprime definitivement.');
    } catch (error) {
      setMsg(
        `Erreur de suppression: ${
          error instanceof Error ? error.message : 'inconnue'
        }`
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Agenda calcule</CardTitle>
            <CardDescription>
              Visualisez l&apos;emploi du temps calcule pour le membre selectionne.
            </CardDescription>
            <CalculatedAgendaPartnersLegend
              deletingId={deletingId}
              msg={msg}
              onDeleteStudent={deleteStudent}
              partnerLegend={partnerLegend}
            />
          </div>

          <div className="flex items-center gap-3">
            <ValidateAllInstructorsButton
              loading={commitLoading}
              matches={matchesLocal}
              onValidate={saveSchedule}
            />
            <div className="w-64">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {derivedUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name ?? user.id}{' '}
                      {user.role
                        ? `(${user.role === 'instructor' ? 'Moniteur' : 'Eleve'})`
                        : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <CalculatedAgendaGrid
          items={items}
          itemsByDay={itemsByDay}
          selectedUser={selectedUser}
          selectedUserId={selectedUserId}
        />
      </CardContent>
    </Card>
  );
}

function ValidateAllInstructorsButton({
  loading,
  matches,
  onValidate,
}: {
  loading: boolean;
  matches: Match[];
  onValidate: (payload: { matches: Match[]; scope?: string }) => Promise<void>;
}) {
  const [msg, setMsg] = useState<string | null>(null);

  const handleValidate = async () => {
    setMsg(null);
    try {
      await onValidate({ matches, scope: 'instructors' });
      setMsg('Agendas moniteurs valides.');
    } catch (error) {
      console.error('commit error', error);
      setMsg(
        `Erreur: ${error instanceof Error ? error.message : "echec de l'enregistrement"}`
      );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleValidate} disabled={loading || matches.length === 0}>
        {loading ? 'Validation...' : 'Valider tous les moniteurs'}
      </Button>
      {msg && <span className="text-xs text-neutral-600">{msg}</span>}
    </div>
  );
}
