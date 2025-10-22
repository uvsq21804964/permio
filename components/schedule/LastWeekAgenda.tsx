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
] as const;
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 08 → 19
const START_HOUR = 8;
const PIXELS_PER_HOUR = 80;

// Palette de classes Tailwind {bg + border + text}
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

// Clé partenaire stable: privilégie un identifiant si dispo
function getPartnerKey(slot: Slot) {
  // côté moniteur: studentId est présent; côté élève: on n’a que instructorName
  return slot.studentName && slot.instructorName
    ? `${slot.studentName}↔${slot.instructorName}` // cas théorique si les deux remontent
    : slot.studentName
    ? slot.studentName
    : slot.instructorName || '—';
}

// Hash déterministe simple pour indexer la palette
function hashStringToIndex(s: string, modulo: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

// Donne la classe couleur pour un slot, constante pour le partenaire
function getPartnerColor(slot: Slot) {
  const key = getPartnerKey(slot);
  const idx = hashStringToIndex(key, PARTNER_PALETTE.length);
  return PARTNER_PALETTE[idx];
}

type Role = 'student' | 'instructor' | 'admin';

type Slot = {
  startTime: string; // "HH:MM" ou "HH:MM:SS"
  endTime: string; // "HH:MM" ou "HH:MM:SS"
  studentName?: string | null;
  instructorName?: string | null;
};

type ApiDay =
  | { dayOfWeek: number; dayDate?: string; slots: Slot[] }
  | { dayOfWeek: number; dayDate?: string; slots: [] };

type ApiResponse = {
  weekShown: string; // "YYYY-MM-DD" (lundi de la semaine affichée = S)
  gatedOn: string; // "YYYY-MM-DD" (lundi de S+1 exigé pour validation)
  user: { id: string; name: string | null; role: Role };
  days: ApiDay[];
  hasDetailedSlots: boolean;
  note?: string;
};

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function getBlockStyle(startTime: string, endTime: string) {
  const start = timeToMinutes(stripSeconds(startTime));
  const end = timeToMinutes(stripSeconds(endTime));
  const offset = start - START_HOUR * 60;
  const dur = Math.max(0, end - start);
  return {
    top: (offset / 60) * PIXELS_PER_HOUR,
    height: (dur / 60) * PIXELS_PER_HOUR,
  };
}

function getDurationColor(startTime: string, endTime: string) {
  const dur =
    timeToMinutes(stripSeconds(endTime)) -
    timeToMinutes(stripSeconds(startTime));
  if (dur < 45) return 'bg-emerald-50 border-emerald-300 text-emerald-900';
  if (dur < 75) return 'bg-blue-50 border-blue-300 text-blue-900';
  if (dur < 135) return 'bg-indigo-50 border-indigo-300 text-indigo-900';
  return 'bg-purple-50 border-purple-300 text-purple-900';
}

/** Supprime les secondes si présentes ("HH:MM:SS" -> "HH:MM"). */
function stripSeconds(t: string) {
  const parts = t.split(':');
  if (parts.length >= 2)
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  return t;
}

/** Parse "YYYY-MM-DD" sans décalage de fuseau (local). */
function parseISODateLocal(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** Format court "dd/mm". */
function fmtDDMM(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

/** Re-dump en "YYYY-MM-DD" pour comparaisons. */
function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function LastWeekAgenda({ userId }: { userId?: string }) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [needsValidation, setNeedsValidation] = useState(false);
  const [requiredWeekStart, setRequiredWeekStart] = useState<string | null>(
    null
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
        // Aligne l’URL avec la route serveur: /api/me/last-week
        const res = await fetch(`/api/me/last-week${qs}`, {
          credentials: 'include',
        });

        if (res.status === 428) {
          const payload = await res.json().catch(() => ({}));
          setNeedsValidation(true);
          setRequiredWeekStart(payload?.requireValidationFor ?? null);
          setData(null);
          return; // on n’affiche pas l’agenda
        }

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(txt || `HTTP ${res.status}`);
        }

        const json = (await res.json()) as ApiResponse;
        setData(json);
        setNeedsValidation(false);
        setRequiredWeekStart(null);
      } catch (e: any) {
        setErr(e?.message ?? 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const daysMap = useMemo(() => {
    const m = new Map<number, ApiDay>();
    data?.days?.forEach((d) => m.set(d.dayOfWeek, d));
    return m;
  }, [data]);

  /** Calcule pour chaque index 0..6 : la date effective et si c’est aujourd’hui. */
  const dayHeaders = useMemo(() => {
    if (!data?.weekShown) {
      return DAYS.map((label) => ({
        label,
        dateLabel: '',
        iso: '',
        isToday: false,
      }));
    }

    const base = parseISODateLocal(data.weekShown); // lundi S affiché
    const today = new Date();
    const todayISO = toISO(today);

    return DAYS.map((label, i) => {
      const d = daysMap.get(i);
      const dt = d?.dayDate
        ? parseISODateLocal(d.dayDate)
        : new Date(base.getTime());
      if (!d?.dayDate) dt.setDate(base.getDate() + i);

      const iso = toISO(dt);
      return {
        label,
        dateLabel: fmtDDMM(dt),
        iso,
        isToday: iso === todayISO,
      };
    });
  }, [data?.weekShown, daysMap]);

  // En-tête lisible: "Semaine du dd/mm au dd/mm"
  const headerRange = useMemo(() => {
    if (!data?.weekShown) return '';
    const start = parseISODateLocal(data.weekShown);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${fmtDDMM(start)} → ${fmtDDMM(end)}`;
  }, [data?.weekShown]);

  // Détermine pour chaque slot quel “nom” afficher (moniteur ou élève)
  const getCounterpartName = (slot: Slot) =>
    slot.studentName ?? slot.instructorName ?? null;

  const partnerLegend = useMemo(() => {
    if (!data?.days) return [];
    const set = new Map<string, string>(); // key -> class
    for (const d of data.days) {
      const slots = (d as any)?.slots ?? [];
      for (const s of slots as Slot[]) {
        const key = getPartnerKey(s);
        if (!set.has(key)) set.set(key, getPartnerColor(s));
      }
    }
    return Array.from(set.entries()); // [ [name, class], ... ]
  }, [data?.days]);

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            Programme de la semaine{' '}
            {headerRange && (
              <span className="text-neutral-500">• {headerRange}</span>
            )}
            {partnerLegend.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {partnerLegend.map(([name, klass]) => (
                  <div
                    key={name}
                    className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs ${klass}`}
                    title={name}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full border`}
                    />
                    <span className="truncate max-w-[160px]">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {data?.user && (
            <div className="text-sm">
              <span className="font-medium">
                {data.user.name ?? data.user.id}
              </span>{' '}
              <span className="text-neutral-500">
                (
                {data.user.role === 'instructor'
                  ? 'Moniteur'
                  : data.user.role === 'student'
                  ? 'Élève'
                  : 'Admin'}
                )
              </span>
            </div>
          )}
        </div>

        {data?.note && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            {data.note}
          </div>
        )}
        {err && <div className="mt-2 text-xs text-red-600">Erreur : {err}</div>}
      </div>

      {needsValidation && (
        <div className="p-4">
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3">
            <div className="text-sm text-amber-900">
              Vous devez valider vos disponibilités pour la semaine du{' '}
              <span className="font-medium">{requiredWeekStart ?? '—'}</span>{' '}
              avant d’accéder à votre agenda.
            </div>
            <div className="mt-2">
              <a
                href={`/myavailabilities`}
                className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                Valider mes disponibilités
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 overflow-x-auto">
        {loading ? (
          <div className="text-sm text-neutral-500">Chargement…</div>
        ) : !data ? (
          <div className="text-sm text-neutral-500">Aucune donnée.</div>
        ) : (
          <div className="min-w-[800px]">
            {/* Header row */}
            <div className="grid grid-cols-8 gap-0">
              <div className="font-medium text-sm text-muted-foreground p-2 border-b">
                Heure
              </div>
              {dayHeaders.map((d) => (
                <div
                  key={d.label}
                  className={`font-medium text-sm text-center p-2 border-b border-r ${
                    d.isToday ? 'bg-green-50 text-green-900' : ''
                  }`}
                >
                  {d.label}
                  <span className="ml-1 text-xs text-neutral-500">
                    {d.dateLabel ? `• ${d.dateLabel}` : ''}
                  </span>
                  {d.isToday && (
                    <span className="ml-2 inline-flex items-center rounded px-1 py-0.5 text-[10px] font-medium border bg-green-200 border-green-500 text-green-900">
                      Aujourd’hui
                    </span>
                  )}
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
                    {String(hour).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS.map((_, dayIndex) => {
                const d = daysMap.get(dayIndex);
                const slots = (d as any)?.slots ?? [];
                const isToday = dayHeaders[dayIndex]?.isToday;

                return (
                  <div
                    key={`day-${dayIndex}`}
                    className={`relative border-r ${
                      isToday ? 'bg-green-100/40 ring-1 ring-green-500' : ''
                    }`}
                  >
                    {/* background cells */}
                    {HOURS.map((hour) => (
                      <div
                        key={`${dayIndex}-${hour}`}
                        className="border-b"
                        style={{ height: `${PIXELS_PER_HOUR}px` }}
                      />
                    ))}

                    {/* blocks */}
                    {Array.isArray(slots) &&
                      slots.length > 0 &&
                      slots.map((s: Slot, i: number) => {
                        const { top, height } = getBlockStyle(
                          s.startTime,
                          s.endTime
                        );
                        const cc = getPartnerColor(s);

                        const start = stripSeconds(s.startTime);
                        const end = stripSeconds(s.endTime);
                        const counterpart = getCounterpartName(s);

                        return (
                          <div
                            key={`${dayIndex}-${i}`}
                            className={`absolute left-1 right-1 text-xs p-2 rounded-md border ${cc}`}
                            style={{ top, height, minHeight: '24px' }}
                            title={
                              counterpart
                                ? `${start}–${end} avec ${counterpart}`
                                : `${start}–${end}`
                            }
                          >
                            <div className="text-[10px] font-medium">
                              {start} - {end}
                            </div>
                            {counterpart && (
                              <div className="text-[10px] text-neutral-600 truncate">
                                avec {counterpart}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
