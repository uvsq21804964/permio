'use client';

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([
    { startTime: '08:00', endTime: '09:00' },
  ]);
  const [error, setError] = useState<string>('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // 1) Charger les users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setUsersError(null);
      try {
        const res = await fetch('/api/users', { credentials: 'include' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({} as any));
          const msg = err?.error || `Erreur API /api/users (${res.status})`;
          setUsers([]);
          setSelectedUserId('');
          setUsersError(msg);
          return;
        }
        const data = await res.json();
        // normalisation en tableau
        const list: User[] = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.users)
          ? (data as any).users
          : [];

        setUsers(list);
        setSelectedUserId(list[0]?.id ?? '');
      } catch (error) {
        console.error('[v0] Error fetching users:', error);
        setUsers([]);
        setSelectedUserId('');
        setUsersError('Impossible de charger les utilisateurs');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // 2) Charger les disponibilités (seulement si un user est sélectionné)
  useEffect(() => {
    if (!selectedUserId) return;
    const fetchAvailabilities = async () => {
      setLoadingAvail(true);
      try {
        const res = await fetch(`/api/availabilities?userId=${selectedUserId}`);
        const data = await res.json();
        setAvailabilities(data);
      } catch (e) {
        console.error('[v0] Error fetching availabilities:', e);
      } finally {
        setLoadingAvail(false);
      }
    };
    fetchAvailabilities();
  }, [selectedUserId]);

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
    for (let i = 0; i < timeRanges.length; i++) {
      const range = timeRanges[i];
      const startMinutes = timeToMinutes(range.startTime);
      const endMinutes = timeToMinutes(range.endTime);

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
      const promises = timeRanges.map((range) =>
        fetch('/api/availabilities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUserId,
            dayOfWeek: selectedDay,
            startTime: range.startTime,
            endTime: range.endTime,
          }),
        })
      );

      await Promise.all(promises);

      const response = await fetch(
        `/api/availabilities?userId=${selectedUserId}`
      );
      const data = await response.json();
      setAvailabilities(data);

      setDialogOpen(false);
      setTimeRanges([{ startTime: '08:00', endTime: '09:00' }]);
      setError('');
    } catch (error) {
      console.error('[v0] Error creating availabilities:', error);
      setError('Erreur lors de la création des disponibilités');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const refreshResponse = await fetch(
          `/api/availabilities?userId=${selectedUserId}`
        );
        const data = await refreshResponse.json();
        setAvailabilities(data);
      } else {
        console.error('[v0] Error deleting availability: Response not OK');
      }
    } catch (error) {
      console.error('[v0] Error deleting availability:', error);
    }
  };

  const getAvailabilitiesForDay = (day: number) => {
    return availabilities.filter((avail) => avail.dayOfWeek === day);
  };

  if (loadingUsers) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </CardContent>
      </Card>
    );
  }

  if (!loadingUsers && users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm">
            Aucun utilisateur dans cette agence. Ajoutez-en un pour commencer.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (usersError) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">{usersError}</p>
          <p className="text-sm mt-2 text-muted-foreground">
            Astuce : assurez-vous d’être connecté via Clerk.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm">Aucun utilisateur disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {usersError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{usersError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Disponibilités hebdomadaires</CardTitle>
            <div className="w-64">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
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
