'use client';

import { useEffect, useMemo, useState } from 'react';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08:00 → 19:00
const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 80;
const BUCKET_MIN = 15; // résolution du heatmap (15 min)

type Student = { id: string; name: string | null };

type User = {
  id: string;
  name?: string | null;
  role: 'student' | 'instructor' | 'admin';
};

type Availability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi, 6 = Dimanche
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  user?: User | null; // selon ton API
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Donne une couleur RGBA basée sur l'intensité (0..1). Base: bleu. */
function heatColor(intensity: number) {
  // bleu-500 rgb(59,130,246) avec alpha variable (0..0.9)
  const alpha = Math.max(0, Math.min(0.9, intensity * 0.9));
  return `rgba(59,130,246, ${alpha})`;
}

/** Petite échelle de légende de 0 → max */
function Legend({ max }: { max: number }) {
  const steps = 5;
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-600">
      <span>0</span>
      <div className="h-3 w-40 rounded overflow-hidden flex">
        {Array.from({ length: steps }).map((_, i) => {
          const x = i / (steps - 1);
          return (
            <div
              key={i}
              className="flex-1"
              style={{ backgroundColor: heatColor(x) }}
            />
          );
        })}
      </div>
      <span>{max}</span>
      <span className="text-neutral-400">élèves dispo / slot 15 min</span>
    </div>
  );
}

export default function StudentsAvailabilityHeatmap({
  students,
}: {
  students: Student[]; // fourni par le parent
}) {
  // Normalisation de la prop (robuste si le parent change plus tard)
  const studentsSafe: Student[] = Array.isArray(students) ? students : [];

  // Disponibilités (toujours fetch côté heatmap)
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch('/api/availabilities/all', {
          credentials: 'include',
        });
        if (!res.ok)
          throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
        const data = await res.json();
        const list: Availability[] = Array.isArray(data)
          ? data
          : data?.availabilities ?? data?.data ?? [];
        setAvailabilities(list);
      } catch (e: any) {
        console.error('[heatmap] GET /api/availabilities/all failed', e);
        setErr(e?.message ?? 'Erreur de chargement');
        setAvailabilities([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Élèves sans aucune disponibilité cette semaine
  const studentsWithoutAvail = useMemo(() => {
    if (studentsSafe.length === 0) return [];
    const withAvail = new Set(availabilities.map((a) => a.userId));
    return studentsSafe.filter((s) => !withAvail.has(s.id));
  }, [studentsSafe, availabilities]);

  // Pré-calcul du heatmap (par jour et buckets de 15 min)
  const { countsByDay, maxCount } = useMemo(() => {
    const bucketsPerHour = 60 / BUCKET_MIN; // 4 si 15min
    const totalHours = END_HOUR - START_HOUR; // 12
    const bucketsPerDay = totalHours * bucketsPerHour; // 48
    const startMin = START_HOUR * 60;
    const endMin = END_HOUR * 60;

    const counts: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: bucketsPerDay }, () => 0)
    );

    for (const a of availabilities) {
      // Ne compter que les élèves (si l'API renvoie user.role)
      const role = a.user?.role;
      if (role && role !== 'student') continue;

      const day = a.dayOfWeek;
      if (day < 0 || day > 6) continue;

      const s = clamp(timeToMinutes(a.startTime), startMin, endMin);
      const e = clamp(timeToMinutes(a.endTime), startMin, endMin);
      if (e <= s) continue;

      const firstBucket = Math.floor((s - startMin) / BUCKET_MIN);
      const lastBucketExclusive = Math.ceil((e - startMin) / BUCKET_MIN);

      for (let b = firstBucket; b < lastBucketExclusive; b++) {
        if (b >= 0 && b < bucketsPerDay) counts[day][b] += 1;
      }
    }

    let m = 0;
    for (let d = 0; d < 7; d++) {
      for (let b = 0; b < bucketsPerDay; b++) {
        if (counts[d][b] > m) m = counts[d][b];
      }
    }

    return { countsByDay: counts, maxCount: m };
  }, [availabilities]);

  const bucketHeight = (PIXELS_PER_HOUR * BUCKET_MIN) / 60; // en px

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">
            Carte de chaleur — disponibilités élèves
          </div>
          <div className="text-xs text-neutral-500">
            Plus la couleur est intense, plus il y a d’élèves disponibles sur le
            créneau (15 min).
          </div>
        </div>
        <Legend max={maxCount} />
      </div>

      {/* Message sur les élèves sans disponibilités */}
      {studentsSafe.length > 0 ? (
        studentsWithoutAvail.length > 0 ? (
          <div className="px-4 pt-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
              <span className="font-medium">
                {studentsWithoutAvail.length} élève(s) sans disponibilités cette
                semaine :
              </span>{' '}
              {studentsWithoutAvail.map((s) => s.name).join(', ')}
            </div>
          </div>
        ) : (
          <div className="px-4 pt-3 text-xs text-neutral-500">
            Tous les élèves ont indiqué au moins une disponibilité.
          </div>
        )
      ) : (
        <div className="px-4 pt-3 text-xs text-neutral-500">
          Liste des élèves non fournie par le parent.
        </div>
      )}

      <div className="p-4 overflow-x-auto">
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

          {/* Grid */}
          <div className="grid grid-cols-8 gap-0">
            {/* Hours column */}
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
            {DAYS.map((_, dayIndex) => {
              const dayCounts = countsByDay[dayIndex] ?? [];
              return (
                <div key={`day-${dayIndex}`} className="relative border-r">
                  {/* Hour cells (fond quadrillé) */}
                  {HOURS.map((hour) => (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="border-b"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    />
                  ))}

                  {/* Overlay des buckets (15 minutes) */}
                  <div className="absolute inset-x-0 top-0">
                    {dayCounts.map((count, b) => {
                      const intensity = maxCount > 0 ? count / maxCount : 0;
                      const top = (b * BUCKET_MIN * PIXELS_PER_HOUR) / 60; // px depuis le haut
                      return (
                        <div
                          key={`b-${b}`}
                          className="mx-1 rounded-[2px]"
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top,
                            height: `${bucketHeight}px`,
                            backgroundColor: heatColor(intensity),
                            // petit contour léger pour perception des bandes
                            outline:
                              intensity > 0
                                ? '1px solid rgba(59,130,246,0.15)'
                                : 'none',
                          }}
                          title={
                            maxCount > 0
                              ? `${count} élève(s) dispo`
                              : 'Aucun élève disponible'
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="text-xs text-neutral-500 mt-3">Chargement…</div>
          )}
          {err && (
            <div className="text-xs text-red-600 mt-3">Erreur : {err}</div>
          )}
        </div>
      </div>
    </div>
  );
}
