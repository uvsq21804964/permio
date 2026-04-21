export type Match = {
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
};

export type ScheduleResult = {
  matches: Match[];
};

export type ScheduleUser = {
  id: string;
  name: string;
  role?: string | null;
};

export const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

export const HOURS = Array.from({ length: 12 }, (_, index) => index + 8);
export const START_HOUR = 8;
export const PIXELS_PER_HOUR = 80;

export const PARTNER_PALETTE = [
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
] as const;

export function partnerKeyFromIdName(id?: string, name?: string): string {
  return (id && id.trim()) || (name && name.trim()) || '-';
}
