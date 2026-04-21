'use client';

import { useMemo } from 'react';

import { useAllAvailabilities } from '@/lib/client/hooks/useAllAvailabilities';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];
const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);
const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 80;
const BUCKET_MIN = 15;

type Student = { id: string; name: string | null };

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function heatColor(intensity: number) {
  const alpha = Math.max(0, Math.min(0.9, intensity * 0.9));
  return `rgba(59,130,246, ${alpha})`;
}

function Legend({ max }: { max: number }) {
  const steps = 5;

  return (
    <div className="flex items-center gap-2 text-xs text-neutral-600">
      <span>0</span>
      <div className="h-3 w-40 rounded overflow-hidden flex">
        {Array.from({ length: steps }).map((_, index) => {
          const intensity = index / (steps - 1);
          return (
            <div
              key={index}
              className="flex-1"
              style={{ backgroundColor: heatColor(intensity) }}
            />
          );
        })}
      </div>
      <span>{max}</span>
      <span className="text-neutral-400">eleves dispo / slot 15 min</span>
    </div>
  );
}

export default function StudentsAvailabilityHeatmap({
  students,
}: {
  students: Student[];
}) {
  const studentsSafe: Student[] = Array.isArray(students) ? students : [];
  const { availabilities, loading, error } = useAllAvailabilities({
    loadErrorMessage: 'Erreur de chargement',
  });

  const studentsWithoutAvail = useMemo(() => {
    if (studentsSafe.length === 0) return [];
    const usersWithAvailabilities = new Set(
      availabilities.map((availability) => availability.userId)
    );
    return studentsSafe.filter((student) => !usersWithAvailabilities.has(student.id));
  }, [availabilities, studentsSafe]);

  const { countsByDay, maxCount } = useMemo(() => {
    const bucketsPerHour = 60 / BUCKET_MIN;
    const totalHours = END_HOUR - START_HOUR;
    const bucketsPerDay = totalHours * bucketsPerHour;
    const startMinutes = START_HOUR * 60;
    const endMinutes = END_HOUR * 60;

    const counts = Array.from({ length: 7 }, () =>
      Array.from({ length: bucketsPerDay }, () => 0)
    );

    for (const availability of availabilities) {
      const role = availability.user?.role;
      if (role && role !== 'student') continue;

      const day = availability.dayOfWeek;
      if (day < 0 || day > 6) continue;

      const start = clamp(
        timeToMinutes(availability.startTime),
        startMinutes,
        endMinutes
      );
      const end = clamp(
        timeToMinutes(availability.endTime),
        startMinutes,
        endMinutes
      );
      if (end <= start) continue;

      const firstBucket = Math.floor((start - startMinutes) / BUCKET_MIN);
      const lastBucketExclusive = Math.ceil((end - startMinutes) / BUCKET_MIN);

      for (let bucket = firstBucket; bucket < lastBucketExclusive; bucket += 1) {
        if (bucket >= 0 && bucket < bucketsPerDay) {
          counts[day][bucket] += 1;
        }
      }
    }

    let max = 0;
    for (let day = 0; day < 7; day += 1) {
      for (let bucket = 0; bucket < bucketsPerDay; bucket += 1) {
        if (counts[day][bucket] > max) {
          max = counts[day][bucket];
        }
      }
    }

    return { countsByDay: counts, maxCount: max };
  }, [availabilities]);

  const bucketHeight = (PIXELS_PER_HOUR * BUCKET_MIN) / 60;

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">
            Carte de chaleur - disponibilités élèves
          </div>
          <div className="text-xs text-neutral-500">
            Plus la couleur est intense, plus il y a d&apos;eleves disponibles sur le
            créneau (15 min).
          </div>
        </div>
        <Legend max={maxCount} />
      </div>

      {studentsSafe.length > 0 ? (
        studentsWithoutAvail.length > 0 ? (
          <div className="px-4 pt-3">
            <div className="rounded-md border border-amber-200 bg-amber-50 text-amber-900 p-3 text-sm">
              <span className="font-medium">
                {studentsWithoutAvail.length} élève(s) sans disponibilités cette
                semaine :
              </span>{' '}
              {studentsWithoutAvail.map((student) => student.name).join(', ')}
            </div>
          </div>
        ) : (
          <div className="px-4 pt-3 text-xs text-neutral-500">
            Tous les eleves ont indique au moins une disponibilite.
          </div>
        )
      ) : (
        <div className="px-4 pt-3 text-xs text-neutral-500">
          Liste des eleves non fournie par le parent.
        </div>
      )}

      <div className="p-4 overflow-x-auto">
        <div className="min-w-[800px]">
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

          <div className="grid grid-cols-8 gap-0">
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

            {DAYS.map((_, dayIndex) => {
              const dayCounts = countsByDay[dayIndex] ?? [];

              return (
                <div key={`day-${dayIndex}`} className="relative border-r">
                  {HOURS.map((hour) => (
                    <div
                      key={`${dayIndex}-${hour}`}
                      className="border-b"
                      style={{ height: `${PIXELS_PER_HOUR}px` }}
                    />
                  ))}

                  <div className="absolute inset-x-0 top-0">
                    {dayCounts.map((count, bucket) => {
                      const intensity = maxCount > 0 ? count / maxCount : 0;
                      const top = (bucket * BUCKET_MIN * PIXELS_PER_HOUR) / 60;

                      return (
                        <div
                          key={`b-${bucket}`}
                          className="mx-1 rounded-[2px]"
                          style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top,
                            height: `${bucketHeight}px`,
                            backgroundColor: heatColor(intensity),
                            outline:
                              intensity > 0
                                ? '1px solid rgba(59,130,246,0.15)'
                                : 'none',
                          }}
                          title={
                            maxCount > 0
                              ? `${count} eleve(s) dispo`
                              : 'Aucun eleve disponible'
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
            <div className="text-xs text-neutral-500 mt-3">Chargement...</div>
          )}
          {error && (
            <div className="text-xs text-red-600 mt-3">Erreur : {error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
