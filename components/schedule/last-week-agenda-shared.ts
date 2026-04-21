import { getStablePaletteClass } from '@/lib/client/utils/schedule-display';

export const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
] as const;

export const HOURS = Array.from({ length: 19 }, (_, index) => index + 5);
export const START_HOUR = 5;
export const PIXELS_PER_HOUR = 80;

export const PARTNER_PALETTE = [
  'bg-emerald-200 border-emerald-600 text-emerald-950',
  'bg-sky-200 border-sky-600 text-sky-950',
  'bg-violet-200 border-violet-600 text-violet-950',
  'bg-amber-200 border-amber-600 text-amber-950',
  'bg-rose-200 border-rose-600 text-rose-950',
  'bg-teal-200 border-teal-600 text-teal-950',
  'bg-indigo-200 border-indigo-600 text-indigo-950',
  'bg-lime-200 border-lime-600 text-lime-950',
  'bg-fuchsia-200 border-fuchsia-600 text-fuchsia-950',
  'bg-cyan-200 border-cyan-600 text-cyan-950',
  'bg-orange-200 border-orange-600 text-orange-950',
  'bg-blue-200 border-blue-600 text-blue-950',
] as const;

export type Role = 'student' | 'instructor' | 'admin';

export type Slot = {
  id?: number | string;
  startTime: string;
  endTime: string;
  studentId?: string | null;
  studentName?: string | null;
  instructorName?: string | null;
  serviceName?: string | null;
  servicePrice?: number | string | null;
  formattedAddress?: string | null;
};

export type ApiDay =
  | { dayOfWeek: number; dayDate?: string | null; slots: Slot[] }
  | { dayOfWeek: number; dayDate?: string | null; slots: [] };

export type NextSlot = {
  date: string;
  startTime: string;
  endTime: string;
  counterpartName: string | null;
};

export type TravelSlot = {
  date: string;
  startTime: string;
  endTime: string;
  fromLabel: string | null;
  toLabel: string | null;
};

export type LastWeekAgendaResponse = {
  weekShown: string;
  user: { id: string; name: string | null; role: Role };
  days: ApiDay[];
  hasDetailedSlots: boolean;
  nextSlots?: NextSlot[];
  travelsByDate?: Record<string, TravelSlot[]>;
};

export function formatServicePrice(
  price: number | string | null | undefined
): string | null {
  if (price === null || price === undefined) {
    return null;
  }

  const numericPrice = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(numericPrice)) {
    return String(price);
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 2,
    }).format(numericPrice);
  } catch {
    return numericPrice.toFixed(2);
  }
}

export function getSlotPartnerKey(slot: Slot, viewerRole?: Role): string {
  if (viewerRole === 'instructor') {
    return (slot.studentId ?? slot.studentName ?? 'UNKNOWN_STUDENT').trim();
  }

  if (viewerRole === 'student') {
    return (slot.instructorName ?? 'UNKNOWN_INSTRUCTOR').trim();
  }

  return (
    slot.studentId ??
    slot.studentName ??
    slot.instructorName ??
    'UNKNOWN_PARTNER'
  ).trim();
}

export function getSlotColorClass(slot: Slot, viewerRole?: Role): string {
  return getStablePaletteClass(
    getSlotPartnerKey(slot, viewerRole),
    PARTNER_PALETTE
  );
}

export function getCounterpartName(slot: Slot): string | null {
  return slot.studentName ?? slot.instructorName ?? null;
}

export function buildTravelMapsUrl(travel: TravelSlot): string | null {
  const origin = travel.fromLabel ?? null;
  const destination = travel.toLabel ?? null;

  if (!origin && !destination) {
    return null;
  }

  const params: string[] = ['api=1'];
  if (origin) {
    params.push(`origin=${encodeURIComponent(origin)}`);
  }
  if (destination) {
    params.push(`destination=${encodeURIComponent(destination)}`);
  }

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

export function withLocalePath(path: string, locale: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.startsWith(`/${locale}/`)
    ? normalizedPath
    : `/${locale}${normalizedPath}`;
}
