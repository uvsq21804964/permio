'use client';

import { useAuth } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';

import type React from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 to 19:00 (representing up to 20:00)
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80; // Height of each hour row in pixels

type User = {
  id: string;
  name: string;
  role: string;
};

type Availability = {
  id: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  user: User;
};

type TimeRange = {
  startTime: string;
  endTime: string;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const getAvailabilityStyle = (startTime: string, endTime: string) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const startOffsetMinutes = startMinutes - START_HOUR * 60;
  const durationMinutes = endMinutes - startMinutes;

  const top = (startOffsetMinutes / 60) * PIXELS_PER_HOUR;
  const height = (durationMinutes / 60) * PIXELS_PER_HOUR;

  return { top, height };
};

const getDurationColor = (startTime: string, endTime: string) => {
  const durationMinutes = timeToMinutes(endTime) - timeToMinutes(startTime);

  if (durationMinutes < 30) {
    return 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100';
  } else if (durationMinutes < 60) {
    return 'bg-blue-50 border-blue-300 text-blue-900 hover:bg-blue-100';
  } else if (durationMinutes < 120) {
    return 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100';
  } else {
    return 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100';
  }
};

export function AvailabilityAgenda() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '08:00', endTime: '09:00' },
  ]);
  const [error, setError] = useState<string>('');
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const [roleReady, setRoleReady] = useState(false);
  const [availReady, setAvailReady] = useState(false);
  const [meRole, setMeRole] = useState<string | null>(null);

  // 1) Ne plus charger la liste des users : on fixe l'utilisateur sélectionné = userId Clerk
  useEffect(() => {
    setUsersError(null);

    if (!isLoaded) return; // attendre Clerk
    if (!isSignedIn || !userId) {
      setSelectedUserId('');
      setUsers([]);
      setRoleReady(false); // pas prêt si pas connecté
      return;
    }

    const fallbackDisplayName =
      [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress ||
      'Moi';

    (async () => {
      try {
        setRoleReady(false); // ⬅︎ on (re)passe en “loading rôle”
        const res = await fetch('/api/me/role', { credentials: 'include' });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const me: { id: string; name?: string; role: string } =
          await res.json();

        setUsers([
          { id: me.id, name: me.name || fallbackDisplayName, role: me.role },
        ]);
        setSelectedUserId(me.id);
        setMeRole(me.role); // optionnel
        setRoleReady(true); // ✅ rôle prêt
      } catch (e) {
        console.error('/api/me/role failed:', e);
        setUsersError("Impossible de charger l'utilisateur courant");
        setSelectedUserId(userId); // fallback
        setMeRole(null);
        setRoleReady(true); // ✅ on “débloque” quand même l’UI
      }
    })();
  }, [isLoaded, isSignedIn, userId, user]);

  // 2) Charger les disponibilités UNIQUEMENT pour l'utilisateur connecté
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    if (!roleReady) return; // ⬅︎ attend le rôle

    const fetchAvailabilities = async () => {
      setLoadingAvail(true);
      setAvailReady(false); // ⬅︎ passe en “loading dispos”
      try {
        const res = await fetch(`/api/availabilities`, {
          credentials: 'include',
        });
        if (!res.ok)
          throw new Error(`Erreur API /api/availabilities (${res.status})`);
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.availabilities)
          ? data.availabilities
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setAvailabilities(list);
      } catch (e) {
        console.error('[v0] Error fetching availabilities:', e);
        setAvailabilities([]); // ✅ pas d’erreur bloquante
      } finally {
        setLoadingAvail(false);
        setAvailReady(true); // ✅ dispos prêtes (même si vide)
      }
    };

    fetchAvailabilities();
  }, [isLoaded, isSignedIn, userId, roleReady]);

  const handleCellClick = (day: number, hour: number) => {
    setSelectedDay(day);
    setTimeRanges([
      {
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
      },
    ]);
    setDialogOpen(true);
  };

  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { startTime: '08:00', endTime: '09:00' }]);
  };

  const removeTimeRange = (index: number) => {
    if (timeRanges.length > 1) {
      setTimeRanges(timeRanges.filter((_, i) => i !== index));
    }
  };

  const updateTimeRange = (
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    const updated = [...timeRanges];
    updated[index][field] = value;
    setTimeRanges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDay === null || !selectedUserId) return;

    setError('');

    // validations locales
    for (let i = 0; i < timeRanges.length; i++) {
      const { startTime, endTime } = timeRanges[i];
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      if (endMinutes <= startMinutes) {
        setError(
          `Plage ${i + 1}: L'heure de fin doit être après l'heure de début`
        );
        return;
      }
      if (startMinutes < START_HOUR * 60 || endMinutes > 20 * 60) {
        setError(
          `Plage ${i + 1}: Les horaires doivent être entre 8h00 et 20h00`
        );
        return;
      }
    }

    try {
      // ✅ envoi SÉQUENTIEL pour éviter les races en base
      for (const range of timeRanges) {
        const res = await fetch('/api/availabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            dayOfWeek: selectedDay,
            startTime: range.startTime,
            endTime: range.endTime,
          }),
        });
        if (!res.ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(`POST /api/availabilities ${res.status} ${msg}`);
        }
      }

      // rafraîchir la liste
      const response = await fetch('/api/availabilities', {
        credentials: 'include',
      });
      if (!response.ok) {
        const msg = await response.text().catch(() => '');
        throw new Error(`GET /api/availabilities ${response.status} ${msg}`);
      }
      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.availabilities)
        ? data.availabilities
        : Array.isArray(data?.data)
        ? data.data
        : [];
      setAvailabilities(list);

      // reset UI
      setDialogOpen(false);
      setTimeRanges([{ startTime: '08:00', endTime: '09:00' }]);
      setError('');
    } catch (err) {
      console.error('[v0] Error creating availabilities:', err);
      setError('Erreur lors de la création des disponibilités');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        const refresh = await fetch('/api/availabilities', {
          credentials: 'include',
        });
        if (!refresh.ok) {
          console.error('Refresh failed', await refresh.text().catch(() => ''));
          return;
        }
        const data = await refresh.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.availabilities)
          ? data.availabilities
          : Array.isArray(data?.data)
          ? data.data
          : [];
        setAvailabilities(list);
      } else {
        console.error(
          '[v0] Error deleting availability:',
          response.status,
          await response.text().catch(() => '')
        );
      }
    } catch (error) {
      console.error('[v0] Error deleting availability:', error);
    }
  };

  const getAvailabilitiesForDay = (day: number) => {
    return availabilities.filter((avail) => avail.dayOfWeek === day);
  };

  return (
    <>
      {roleReady && availReady ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Disponibilités hebdomadaires</CardTitle>
              <div className="w-64">
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground">
                        {usersError
                          ? 'Accès refusé ou session expirée. Connectez-vous.'
                          : 'Aucun utilisateur disponible.'}
                      </div>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} (
                          {user.role === 'instructor' ? 'Moniteur' : 'Élève'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-muted-foreground text-sm mt-2">
              Cliquez sur une case vide pour ajouter des disponibilités, ou sur
              une disponibilité existante pour la supprimer
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header row */}
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

                {/* Time slots grid */}
                <div className="grid grid-cols-8 gap-0">
                  {/* Hour labels column */}
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

                  {/* Day columns */}
                  {DAYS.map((_, dayIndex) => (
                    <div key={`day-${dayIndex}`} className="relative border-r">
                      {/* Hour cells */}
                      {HOURS.map((hour) => (
                        <div
                          key={`${dayIndex}-${hour}`}
                          className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                          onClick={() => handleCellClick(dayIndex, hour)}
                        />
                      ))}

                      {/* Availability blocks positioned absolutely within the day column */}
                      {getAvailabilitiesForDay(dayIndex).map((avail) => {
                        const { top, height } = getAvailabilityStyle(
                          avail.startTime,
                          avail.endTime
                        );
                        const colorClass = getDurationColor(
                          avail.startTime,
                          avail.endTime
                        );
                        return (
                          <div
                            key={avail.id}
                            className={`absolute left-1 right-1 text-xs p-2 rounded border group cursor-pointer transition-colors ${colorClass}`}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              minHeight: '24px',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(avail.id);
                            }}
                          >
                            <div className="flex items-start justify-between gap-1 h-full">
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-medium leading-tight">
                                  {avail.startTime} - {avail.endTime}
                                </div>
                              </div>
                              <Trash2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Placeholder très simple pendant le chargement
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          {usersError
            ? 'Impossible de récupérer votre statut ou vos disponibilités.'
            : 'Chargement de vos disponibilités…'}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des disponibilités</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Jour</Label>
              <Input
                value={selectedDay !== null ? DAYS[selectedDay] : ''}
                disabled
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Plages horaires</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimeRange}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une plage
                </Button>
              </div>

              {timeRanges.map((range, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor={`start-${index}`} className="text-xs">
                        Début
                      </Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.startTime}
                        onChange={(e) =>
                          updateTimeRange(index, 'startTime', e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`end-${index}`} className="text-xs">
                        Fin
                      </Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        min="08:00"
                        max="20:00"
                        value={range.endTime}
                        onChange={(e) =>
                          updateTimeRange(index, 'endTime', e.target.value)
                        }
                        required
                      />
                    </div>
                  </div>
                  {timeRanges.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeRange(index)}
                      className="flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit">Ajouter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
