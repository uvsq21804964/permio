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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

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

type ScheduleResult = { matches: Match[] };
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
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08 → 19 (fond jusqu’à 20:00)
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80;

/* -------------------- Helpers temps -------------------- */
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
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

/* -------------------- Palette & hash pour couleurs partenaires -------------------- */
const PARTNER_PALETTE = [
  'bg-emerald-50 border-emerald-300 text-emerald-900',
  'bg-sky-50 border-sky-300 text-sky-900',
  'bg-violet-50 border-violet-300 text-violet-900',
  'bg-amber-50 border-amber-300 text-amber-900',
  'bg-rose-50 border-rose-300 text-rose-900',
  'bg-teal-50 border-teal-300 text-teal-900',
  'bg-indigo-50 border-indigo-300 text-indigo-900',
  'bg-lime-50 border-lime-300 text-lime-900',
  'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-900',
  'bg-cyan-50 border-cyan-300 text-cyan-900',
  'bg-orange-50 border-orange-300 text-orange-900',
  'bg-blue-50 border-blue-300 text-blue-900',
];

function hashStringToIndex(s: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

function partnerKeyFromIdName(id?: string, name?: string) {
  return (id && id.trim()) || (name && name.trim()) || '—';
}

/* -------------------- Composant -------------------- */
export function CalculatedAgendaSection({
  result,
  orgId,
}: {
  result: ScheduleResult;
  orgId?: string;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [matchesLocal, setMatchesLocal] = useState<Match[]>(
    result.matches || []
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Sync si le parent renvoie un nouveau calcul
  useEffect(() => {
    setMatchesLocal(result.matches || []);
  }, [result.matches]);

  // 1) Essaye de charger la liste des utilisateurs
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('users fetch failed');
        const data: User[] = await res.json();
        if (!cancelled) setUsers(data);
      } catch {
        /* fallback silencieux */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Fallback: dérive une liste depuis les matches
  const derivedUsers = useMemo<User[]>(() => {
    if (users.length > 0) return users;
    const byId = new Map<string, User>();
    for (const m of matchesLocal) {
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
  }, [users, matchesLocal]);

  // 3) Sélection par défaut
  useEffect(() => {
    if (!selectedUserId && derivedUsers.length > 0) {
      setSelectedUserId(derivedUsers[0].id);
    }
  }, [derivedUsers, selectedUserId]);

  // 4) Filtrer les matches du membre sélectionné
  const items = useMemo(() => {
    if (!selectedUserId) return [];
    return matchesLocal.filter(
      (m) => m.studentId === selectedUserId || m.instructorId === selectedUserId
    );
  }, [matchesLocal, selectedUserId]);

  // 5) Groupes par jour
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

  /* -------- Légende partenaires (id, label, classe, role) --------
     NB: On n’affiche l’icône de suppression que si role === 'student' */
  const partnerLegend = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        label: string;
        klass: string;
        role: 'student' | 'instructor';
      }
    >();

    for (const m of items) {
      const isStudent = m.studentId === selectedUserId;
      const partnerId = isStudent ? m.instructorId : m.studentId;
      const partnerName = isStudent ? m.instructorName : m.studentName;
      const partnerRole: 'student' | 'instructor' = isStudent
        ? 'instructor'
        : 'student';

      const key = partnerKeyFromIdName(partnerId, partnerName);
      if (!map.has(key)) {
        const idx = hashStringToIndex(key, PARTNER_PALETTE.length);
        map.set(key, {
          id: partnerId || key,
          label: partnerName || key,
          klass: PARTNER_PALETTE[idx],
          role: partnerRole,
        });
      }
    }
    return Array.from(map.values());
  }, [items, selectedUserId]);

  /* -------------------- Suppression élève -------------------- */
  async function deleteStudent(studentId: string) {
    setMsg(null);
    try {
      setDeletingId(studentId);
      const res = await fetch(`/api/users/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: orgId ? { 'x-org-id': orgId } : {},
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      // Retire l'élève des users et des matches
      setUsers((prev) => prev.filter((u) => u.id !== studentId));
      setMatchesLocal((prev) => prev.filter((m) => m.studentId !== studentId));

      // Si l’élève supprimé était sélectionné -> sélectionner un autre user
      setSelectedUserId((prev) =>
        prev === studentId
          ? derivedUsers.find((u) => u.id !== studentId)?.id || ''
          : prev
      );

      setMsg('Élève supprimé définitivement ✅');
    } catch (e: any) {
      setMsg(`Erreur de suppression: ${e?.message || 'inconnue'}`);
    } finally {
      setDeletingId(null);
    }
  }

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

            {/* Légende des partenaires */}
            {partnerLegend.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {partnerLegend.map(({ id, label, klass, role }) => (
                  <div
                    key={id}
                    className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-xs ${klass}`}
                    title={label}
                  >
                    <span className="inline-block h-2 w-2 rounded-full border" />
                    <span className="truncate max-w-[160px]">{label}</span>

                    {/* Bouton supprimer si c'est un ÉLÈVE */}
                    {role === 'student' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            title="Supprimer l'élève"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Supprimer l&apos;élève ?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est <b>définitive</b>. L&apos;élève «{' '}
                              {label} » sera supprimé et tous ses créneaux
                              associés seront retirés de la base de données.
                              Êtes-vous sûr de vouloir continuer ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteStudent(id)}
                              disabled={deletingId === id}
                            >
                              {deletingId === id
                                ? 'Suppression…'
                                : 'Supprimer définitivement'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                ))}
              </div>
            )}

            {msg && (
              <div className="mt-2">
                <Badge variant="secondary">{msg}</Badge>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ValidateAllInstructorsButton matches={matchesLocal} />
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
              {/* En-têtes */}
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

              {/* Grille */}
              <div className="grid grid-cols-8 gap-0">
                {/* Colonne heures */}
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

                {/* Colonnes jours */}
                {DAYS.map((_, dayIndex) => (
                  <div key={`day-${dayIndex}`} className="relative border-r">
                    {/* Cases fond */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="border-b"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* Blocs */}
                    {(itemsByDay.get(dayIndex) || []).map((m, i) => {
                      const { top, height } = getBlockStyle(
                        m.startTime,
                        m.endTime
                      );

                      const isStudentView = m.studentId === selectedUserId;
                      const partnerId = isStudentView
                        ? m.instructorId
                        : m.studentId;
                      const partnerName = isStudentView
                        ? m.instructorName
                        : m.studentName;
                      const key = partnerKeyFromIdName(partnerId, partnerName);
                      const colorClass =
                        PARTNER_PALETTE[
                          hashStringToIndex(key, PARTNER_PALETTE.length)
                        ];

                      return (
                        <div
                          key={`${dayIndex}-${i}`}
                          className={`absolute left-1 right-1 text-xs p-2 rounded-md border ${colorClass}`}
                          style={{ top, height, minHeight: '24px' }}
                          title={`${m.startTime}–${m.endTime} avec ${partnerName}`}
                        >
                          <div className="flex items-start justify-between gap-1 h-full">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium leading-tight">
                                {m.startTime} - {m.endTime}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                avec {partnerName}
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

/* -------------------- Bouton validation (inchangé, utilise matchesLocal) -------------------- */
function ValidateAllInstructorsButton({ matches }: { matches: Match[] }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onValidate = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/schedule/commit', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches, scope: 'instructors' }),
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
