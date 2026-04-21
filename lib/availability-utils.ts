// lib/availability-utils.ts
import type { Kind } from '@/types/availability';

const START_HOUR = 8;
const END_HOUR = 20;
export const PIXELS_PER_HOUR = 60;

export const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

export const DAY_LABELS_SHORT = [
  'Lun',
  'Mar',
  'Mer',
  'Jeu',
  'Ven',
  'Sam',
  'Dim',
];

// ---------- Helpers temps ----------

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function getBlockStyle(startTime: string, endTime: string) {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const offsetFromStart = startM - START_HOUR * 60;
  const duration = endM - startM;

  const top = (offsetFromStart / 60) * PIXELS_PER_HOUR;
  const height = (duration / 60) * PIXELS_PER_HOUR;

  return { top, height };
}

export function getDayOverrideColor(kind: Kind) {
  if (kind === 'available') {
    return 'bg-emerald-100 border-emerald-400 text-emerald-900';
  }
  return 'bg-rose-100 border-rose-400 text-rose-900';
}

export function getDefaultBlockColor() {
  return 'bg-indigo-50 border-indigo-300 text-indigo-900/80';
}

// 🔵 Slots (créneaux réservés) en violet
export function getSlotBlockColor() {
  return 'bg-violet-200 border-violet-500 text-violet-950';
}

// ---------- Helpers dates ----------

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

  const base = iso.slice(0, 10); // 'YYYY-MM-DD'
  const [yStr, mStr, dStr] = base.split('-');

  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysISO(iso: string, delta: number): string {
  const d = isoToDate(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

export function todayWeekStartISO(): string {
  return dateToISO(startOfWeekMonday(new Date()));
}

export function formatDDMM(iso: string): string {
  const d = isoToDate(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
