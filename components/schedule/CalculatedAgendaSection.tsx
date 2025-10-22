// components/schedule/CalculatedAgendaSection.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number; // 0..6
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  duration: number; // minutes
};

type ScheduleResult = {
  matches: Match[];
};

type User = { id: string; name: string; role?: string | null };

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 → 19:00 (cases représentant jusqu'à 20:00)
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80;

const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

const getBlockStyle = (startTime: string, endTime: string) => {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const offset = start - START_HOUR * 60;
  const dur = Math.max(0, end - start);
  return {
    top: (offset / 60) * PIXELS_PER_HOUR,
    height: (dur / 60) * PIXELS_PER_HOUR,
  };
};

const getDurationColor = (startTime: string, endTime: string) => {
  const dur = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (dur < 45) return 'bg-emerald-50 border-emerald-300 text-emerald-900';
  if (dur < 75) return 'bg-blue-50 border-blue-300 text-blue-900';
  if (dur < 135) return 'bg-indigo-50 border-indigo-300 text-indigo-900';
  return 'bg-purple-50 border-purple-300 text-purple-900';
};

export function CalculatedAgendaSection({
  result,
}: {
  result: ScheduleResult;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // 1) On essaie de charger la liste complète des utilisateurs (facultatif)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('users fetch failed');
        const data: User[] = await res.json();
        if (!cancelled) setUsers(data);
      } catch {
        // fallback silencieux : on utilisera les matches pour construire une liste minimale
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Fallback: si /api/users vide, on fabrique une liste à partir des matches
  const derivedUsers = useMemo<User[]>(() => {
    if (users.length > 0) return users;

    const byId = new Map<string, User>();
    for (const m of result.matches || []) {
      if (!byId.has(m.studentId))
        byId.set(m.studentId, {
          id: m.studentId,
          name: m.studentName,
          role: 'student',
        });
      if (!byId.has(m.instructorId))
        byId.set(m.instructorId, {
          id: m.instructorId,
          name: m.instructorName,
          role: 'instructor',
        });
    }
    return Array.from(byId.values());
  }, [users, result.matches]);

  // 3) Sélection par défaut
  useEffect(() => {
    if (!selectedUserId && derivedUsers.length > 0) {
      setSelectedUserId(derivedUsers[0].id);
    }
  }, [derivedUsers, selectedUserId]);

  // 4) On filtre les matches pour le membre sélectionné
  const items = useMemo(() => {
    if (!selectedUserId) return [];
    return (result.matches || []).filter(
      (m) => m.studentId === selectedUserId || m.instructorId === selectedUserId
    );
  }, [result.matches, selectedUserId]);

  // 5) Regroupe par jour
  const itemsByDay = useMemo(() => {
    const map = new Map<number, Match[]>();
    for (const it of items) {
      if (!map.has(it.dayOfWeek)) map.set(it.dayOfWeek, []);
      map.get(it.dayOfWeek)!.push(it);
    }
    for (const v of map.values())
      v.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [items]);

  const selectedUser = useMemo(
    () => derivedUsers.find((u) => u.id === selectedUserId) || null,
    [derivedUsers, selectedUserId]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Agenda calculé</CardTitle>
            <CardDescription>
              Visualisez l&apos;emploi du temps calculé pour le membre
              sélectionné.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {/* Bouton Valider l'agenda */}
            <ValidateAllInstructorsButton matches={result.matches} />

            {/* Sélecteur de membre */}
            <div className="w-64">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {derivedUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name ?? u.id}{' '}
                      {u.role
                        ? `(${u.role === 'instructor' ? 'Moniteur' : 'Élève'})`
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
        {!selectedUserId ? (
          <p className="text-muted-foreground text-sm">
            Sélectionnez un membre pour voir son agenda.
          </p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Aucun créneau attribué pour {selectedUser?.name ?? selectedUserId}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Ligne d'en-tête */}
              <div className="grid grid-cols-8 gap-0">
                <div className="font-medium text-sm text-muted-foreground p-2 border-b">
                  Heure
                </div>
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="font-medium text-sm text-center p-2 border-b border-r"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grille horaire */}
              <div className="grid grid-cols-8 gap-0">
                {/* Colonne des heures */}
                <div>
                  {HOURS.map((hour) => (
                    <div
                      key={`hour-${hour}`}
                      className="text-sm text-muted-foreground p-2 border-r border-b"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    >
                      {hour}:00
                    </div>
                  ))}
                </div>

                {/* Colonnes par jour */}
                {DAYS.map((_, dayIndex) => (
                  <div key={`day-${dayIndex}`} className="relative border-r">
                    {/* Cases horaires (fond) */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="border-b"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* Blocs d'agenda calculé */}
                    {(itemsByDay.get(dayIndex) || []).map((m, i) => {
                      const { top, height } = getBlockStyle(
                        m.startTime,
                        m.endTime
                      );
                      const colorClass = getDurationColor(
                        m.startTime,
                        m.endTime
                      );
                      const isStudent = m.studentId === selectedUserId;
                      const counterpart = isStudent
                        ? m.instructorName
                        : m.studentName;

                      return (
                        <div
                          key={`${dayIndex}-${i}`}
                          className={`absolute left-1 right-1 text-xs p-2 rounded-md border ${colorClass}`}
                          style={{ top, height, minHeight: '24px' }}
                        >
                          <div className="flex items-start justify-between gap-1 h-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium leading-tight">
                                {m.startTime} - {m.endTime}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                avec {counterpart}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ValidateAllInstructorsButton({ matches }: { matches: Match[] }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onValidate = async () => {
    setSaving(true);
    setMsg(null);
    try {
      // Option : passer un lundi précis en YYYY-MM-DD
      // const weekStart = '2025-10-13';

      // ✅ on envoie TOUS les matches (tous les moniteurs)
      const res = await fetch('/api/schedule/commit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches,
          // weekStart,
          scope: 'instructors', // hint pour l’API (voir ci-dessous)
        }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      setMsg('Agendas moniteurs validés ✅');
    } catch (e: any) {
      console.error('commit error', e);
      setMsg(`Erreur: ${e?.message || 'échec de l’enregistrement'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={onValidate} disabled={saving || matches.length === 0}>
        {saving ? 'Validation…' : 'Valider tous les moniteurs'}
      </Button>
      {msg && <span className="text-xs text-neutral-600">{msg}</span>}
    </div>
  );
}
