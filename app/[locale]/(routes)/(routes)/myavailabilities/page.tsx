'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

import { AvailabilityAgenda } from '@/components/availability-agenda'; // ton composant semaine type
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

type Kind = 'available' | 'unavailable';

type DayAvailability = {
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string; // 'HH:MM'
  endTime: string; // 'HH:MM'
  kind: Kind;
};

type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi, 1 = Mardi, ...
  startTime: string;
  endTime: string;
};

const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 60;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ---------- Helpers date / temps ----------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getBlockStyle(startTime: string, endTime: string) {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const offsetFromStart = startM - START_HOUR * 60;
  const duration = endM - startM;

  const top = (offsetFromStart / 60) * PIXELS_PER_HOUR;
  const height = (duration / 60) * PIXELS_PER_HOUR;

  return { top, height };
}

function getDayOverrideColor(kind: Kind) {
  if (kind === 'available') {
    return 'bg-emerald-100 border-emerald-400 text-emerald-900';
  }
  return 'bg-rose-100 border-rose-400 text-rose-900';
}

function getDefaultBlockColor() {
  return 'bg-indigo-50 border-indigo-300 text-indigo-900/80';
}

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay(); // 0..6 (0=dimanche)
  const isoDow = dow === 0 ? 7 : dow;
  const diff = isoDow - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isoToDate(iso: string): Date {
  if (!iso) return new Date(NaN);

  // On garde uniquement 'YYYY-MM-DD'
  const base = iso.slice(0, 10);
  const [yStr, mStr, dStr] = base.split('-');

  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  return new Date(y, (m || 1) - 1, d || 1);
}

function addDaysISO(iso: string, delta: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

function todayWeekStartISO(): string {
  return dateToISO(startOfWeekMonday(new Date()));
}

function formatDDMM(iso: string): string {
  const d = isoToDate(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------- Carte "exceptions jour par jour" (ex-page /daily) ----------

function DailyOverridesCard() {
  const [date, setDate] = useState<string>(todayISO());
  const [kind, setKind] = useState<Kind>('available');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const [entries, setEntries] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const [upcomingEntries, setUpcomingEntries] = useState<DayAvailability[]>([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 4000);
  };

  // --- Fetch pour un jour donné ---
  const fetchEntries = async (dateParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/availabilities/day?date=${dateParam}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: DayAvailability[] = await res.json();
      setEntries(data);
    } catch (e: any) {
      console.error('Error fetching day availabilities:', e);
      setError('Impossible de récupérer vos créneaux pour ce jour.');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch pour tous les créneaux à venir ---
  const fetchUpcoming = async () => {
    setLoadingUpcoming(true);
    try {
      const res = await fetch('/api/availabilities/day?scope=upcoming', {
        credentials: 'include',
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const data: DayAvailability[] = await res.json();

      // sécurité : tri côté front aussi
      const sorted = [...data].sort((a, b) => {
        const aKey = `${a.date} ${a.startTime}`;
        const bKey = `${b.date} ${b.startTime}`;
        return aKey.localeCompare(bKey);
      });

      setUpcomingEntries(sorted);
    } catch (e) {
      console.error('Error fetching upcoming day availabilities:', e);
      // on ne remonte pas forcément en erreur bloquante
    } finally {
      setLoadingUpcoming(false);
    }
  };

  // quand la date change → on recharge la liste du jour
  useEffect(() => {
    if (!date) return;
    fetchEntries(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // au montage → on charge la liste "à venir"
  useEffect(() => {
    fetchUpcoming();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    setError(null);
    setSaving(true);

    try {
      const res = await fetch('/api/availabilities/day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date,
          startTime,
          endTime,
          kind,
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }

      showNotice(
        kind === 'available'
          ? 'Disponibilité ajoutée pour ce jour.'
          : 'Indisponibilité ajoutée pour ce jour.'
      );
      setStartTime('08:00');
      setEndTime('09:00');

      await fetchEntries(date);
      await fetchUpcoming(); // 🔄 on met à jour la liste globale
    } catch (e: any) {
      console.error('Error creating day availability:', e);
      setError(
        e?.message ||
          'Erreur lors de la création de la disponibilité/indisponibilité.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/availabilities/day/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) {
        const txt = await res.text().catch(() => '');
        throw new Error(txt || `HTTP ${res.status}`);
      }
      showNotice('Créneau supprimé.');
      await fetchEntries(date);
      await fetchUpcoming(); // 🔄 on met aussi à jour la liste globale
    } catch (e: any) {
      console.error('Error deleting day availability:', e);
      setError('Erreur lors de la suppression du créneau.');
    }
  };

  const availables = entries.filter((e) => e.kind === 'available');
  const unavailables = entries.filter((e) => e.kind === 'unavailable');

  // petit helper pour l'affichage
  const formatDayLabel = (iso: string) => {
    const d = isoToDate(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  };

  const formatKindBadge = (kind: Kind) =>
    kind === 'available' ? 'Dispo' : 'Indispo';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disponibilités / indisponibilités ponctuelles</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notice && (
          <Alert>
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulaire de création */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Jour concerné</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={kind === 'available' ? 'default' : 'outline'}
                  onClick={() => setKind('available')}
                  className="flex-1"
                >
                  Disponible
                </Button>
                <Button
                  type="button"
                  variant={kind === 'unavailable' ? 'default' : 'outline'}
                  onClick={() => setKind('unavailable')}
                  className="flex-1"
                >
                  Indisponible
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">Début</Label>
              <Input
                id="startTime"
                type="time"
                min="08:00"
                max="20:00"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Fin</Label>
              <Input
                id="endTime"
                type="time"
                min="08:00"
                max="20:00"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Ajouter ce créneau'}
            </Button>
          </div>
        </form>

        {/* 🔥 Tous les créneaux à venir */}
        <div className="space-y-3 pt-4 border-t">
          <p className="text-sm font-medium">
            Tous les créneaux ponctuels à venir
          </p>

          {loadingUpcoming ? (
            <p className="text-sm text-muted-foreground">
              Chargement des créneaux à venir…
            </p>
          ) : upcomingEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun créneau ponctuel à venir.
            </p>
          ) : (
            <ul className="space-y-1">
              {upcomingEntries.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between text-sm border rounded-md px-2 py-1"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted/60 font-mono">
                      {formatDayLabel(e.date)}
                    </span>
                    <span className="font-mono">
                      {e.startTime} – {e.endTime}
                    </span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded uppercase ${
                        e.kind === 'available'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      {formatKindBadge(e.kind)}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Agenda hebdo global (semaine type + exceptions) ----------

function WeeklyGlobalAgenda() {
  const [weekStart, setWeekStart] = useState<string>(todayWeekStartISO);

  const [entriesByDate, setEntriesByDate] = useState<
    Record<string, DayAvailability[]>
  >({});
  const [defaultAvailabilities, setDefaultAvailabilities] = useState<
    DefaultAvailability[]
  >([]);

  const [loading, setLoading] = useState(false);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3000);
  };

  // Charger les dispos par défaut une fois
  useEffect(() => {
    const fetchDefaults = async () => {
      setLoadingDefaults(true);
      try {
        const res = await fetch('/api/availabilities', {
          credentials: 'include',
        });
        if (!res.ok) {
          console.error(
            'Erreur GET /api/availabilities',
            res.status,
            await res.text().catch(() => '')
          );
          return;
        }
        const json = await res.json();
        const list: DefaultAvailability[] = Array.isArray(json)
          ? json
          : Array.isArray(json?.availabilities)
          ? json.availabilities
          : Array.isArray(json?.data)
          ? json.data
          : [];

        setDefaultAvailabilities(list);
      } catch (e) {
        console.error('Error fetching default availabilities', e);
      } finally {
        setLoadingDefaults(false);
      }
    };

    fetchDefaults();
  }, []);

  // Charger les exceptions pour la semaine
  const fetchWeek = async (weekStartISO: string) => {
    setLoading(true);
    setError(null);
    try {
      const dates = Array.from({ length: 7 }, (_, i) =>
        addDaysISO(weekStartISO, i)
      );

      const results = await Promise.all(
        dates.map(async (dateIso) => {
          const res = await fetch(
            `/api/availabilities/day?date=${encodeURIComponent(dateIso)}`,
            { credentials: 'include' }
          );
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} pour le ${dateIso}`);
          }
          const data: DayAvailability[] = await res.json();
          return [dateIso, data] as const;
        })
      );

      const map: Record<string, DayAvailability[]> = {};
      for (const [d, entries] of results) {
        map[d] = entries;
      }
      setEntriesByDate(map);
      showNotice('Semaine chargée.');
    } catch (e: any) {
      console.error('Error fetching weekly agenda', e);
      setError(
        e?.message || 'Impossible de récupérer vos créneaux pour cette semaine.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeek(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  const handlePrevWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => addDaysISO(prev, 7));
  };

  const weekEndISO = addDaysISO(weekStart, 6);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    addDaysISO(weekStart, i)
  );

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Agenda hebdomadaire – vue globale</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Semaine du{' '}
            <span className="font-medium">{formatDDMM(weekStart)}</span> au{' '}
            <span className="font-medium">{formatDDMM(weekEndISO)}</span>.
            <br />
            <span className="text-xs text-muted-foreground">
              Bleu = disponibilités par défaut · Vert = dispo ponctuelle · Rose
              = indispo ponctuelle.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            ← Semaine précédente
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Semaine suivante →
          </Button>
        </div>
      </CardHeader>

      {notice && (
        <div className="px-6">
          <Alert className="mb-3">
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        </div>
      )}

      {error && (
        <div className="px-6">
          <Alert variant="destructive" className="mb-3">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* En-têtes */}
            <div className="grid grid-cols-8">
              <div className="p-2 border-b text-sm font-medium text-muted-foreground">
                Heure
              </div>
              {weekDates.map((dateIso, idx) => (
                <div
                  key={dateIso}
                  className="p-2 border-b border-l text-center text-xs md:text-sm font-medium"
                >
                  <div>{DAY_LABELS_SHORT[idx]}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDDMM(dateIso)}
                  </div>
                </div>
              ))}
            </div>

            {/* Grille */}
            <div className="grid grid-cols-8">
              {/* Colonne heures */}
              <div className="border-r">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b text-xs md:text-sm text-muted-foreground px-2 flex items-start"
                    style={{ height: `${PIXELS_PER_HOUR}px` }}
                  >
                    {h}:00
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {weekDates.map((dateIso, dayIndex) => {
                const entries = entriesByDate[dateIso] || [];
                const defaultsForDay = defaultAvailabilities.filter(
                  (a) => a.dayOfWeek === dayIndex
                );

                return (
                  <div
                    key={dateIso}
                    className="relative border-r last:border-r-0"
                  >
                    {/* Fond heure par heure */}
                    {HOURS.map((h) => (
                      <div
                        key={`${dateIso}-${h}`}
                        className="border-b bg-background/50"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* --- BLOC PAR DÉFAUT (violet) --- */}
                    {defaultsForDay.map((a) => {
                      const { top, height } = getBlockStyle(
                        a.startTime,
                        a.endTime
                      );
                      const colorClass = getDefaultBlockColor();

                      return (
                        <div
                          key={`default-${a.id}-${dateIso}`}
                          className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '22px',
                            opacity: 0.85,
                          }}
                          title={`Par défaut ${a.startTime}–${a.endTime}`}
                        >
                          <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                            <span className="text-[10px] leading-tight truncate">
                              {a.startTime} – {a.endTime}
                            </span>
                            <span className="text-[8px] leading-tight uppercase opacity-70 mt-0.5">
                              Semaine type
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* --- BLOC EXCEPTION (vert/rose) --- */}
                    {entries.map((entry) => {
                      const { top, height } = getBlockStyle(
                        entry.startTime,
                        entry.endTime
                      );
                      const colorClass = getDayOverrideColor(entry.kind);

                      return (
                        <div
                          key={entry.id}
                          className={`absolute left-1 right-1 rounded-md border shadow-sm ${colorClass}`}
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            minHeight: '24px',
                          }}
                          title={`${entry.startTime}–${entry.endTime} (${entry.kind})`}
                        >
                          <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                            <span className="text-[10px] leading-tight truncate">
                              {entry.startTime} – {entry.endTime}
                            </span>
                            <span className="text-[8px] leading-tight uppercase opacity-80 mt-0.5">
                              {entry.kind === 'available'
                                ? 'Dispo ponctuelle'
                                : 'Indisponible'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {(loading || loadingDefaults) && (
              <p className="mt-3 text-xs text-muted-foreground">
                Chargement de la semaine…
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page principale unifiée (sans Tabs) ----------

export default function MyAvailabilitiesPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [activeView, setActiveView] = useState<'configure' | 'global'>(
    'configure'
  );

  if (!isLoaded) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de votre session…
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Vous devez être connecté pour gérer vos disponibilités.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Mes disponibilités
          </h1>
          <p className="text-muted-foreground mt-2">
            Définissez votre semaine type, ajoutez des exceptions jour par jour
            et visualisez le tout dans un agenda hebdomadaire.
          </p>
        </div>

        {/* Switch "Onglets" sans composant Tabs */}
        <div className="flex items-center gap-2 border rounded-full p-1 w-fit bg-muted/40">
          <button
            type="button"
            onClick={() => setActiveView('configure')}
            className={`px-4 py-1.5 text-sm rounded-full transition ${
              activeView === 'configure'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Configurer
          </button>
          <button
            type="button"
            onClick={() => setActiveView('global')}
            className={`px-4 py-1.5 text-sm rounded-full transition ${
              activeView === 'global'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Vue globale
          </button>
        </div>

        {activeView === 'configure' && (
          <div className="space-y-6">
            <AvailabilityAgenda />
            <DailyOverridesCard />
          </div>
        )}

        {activeView === 'global' && <WeeklyGlobalAgenda />}
      </div>
    </div>
  );
}
