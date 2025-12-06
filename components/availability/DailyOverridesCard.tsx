'use client';

import { useEffect, useState } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2 } from 'lucide-react';

import type { DayAvailability, Kind } from '@/types/availability';
import { isoToDate, todayISO } from '@/lib/availability-utils';

export function DailyOverridesCard() {
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

      const sorted = [...data].sort((a, b) => {
        const aKey = `${a.date} ${a.startTime}`;
        const bKey = `${b.date} ${b.startTime}`;
        return aKey.localeCompare(bKey);
      });

      setUpcomingEntries(sorted);
    } catch (e) {
      console.error('Error fetching upcoming day availabilities:', e);
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
      await fetchUpcoming();
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
      await fetchUpcoming();
    } catch (e: any) {
      console.error('Error deleting day availability:', e);
      setError('Erreur lors de la suppression du créneau.');
    }
  };

  const availables = entries.filter((e) => e.kind === 'available');
  const unavailables = entries.filter((e) => e.kind === 'unavailable');

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

        {/* Tous les créneaux à venir */}
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
