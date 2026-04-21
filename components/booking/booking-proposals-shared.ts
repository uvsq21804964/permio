import type { InstructorAgendaResponse } from '@/lib/client/api/booking-client';

import {
  formatTimeForLocale,
  getExactBookableSlotsForDate,
  type ExactBookableSlot,
} from '@/components/booking/booking-page-shared';
import { getEarliestAllowedDateTime } from '@/lib/client/utils/booking';

export type SuggestedBookingSlot = ExactBookableSlot & {
  hasBookingsToday?: boolean;
  score?: number;
};

type SuggestionTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function formatBookingPrice(price: number | string, locale: string): string {
  const num = Number(price);
  if (Number.isNaN(num)) return `${price} EUR`;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(num);
  } catch {
    return `${num.toFixed(2)} EUR`;
  }
}

export function formatSuggestionDate(dateIso: string, locale: string): string {
  try {
    const [y, m, d] = dateIso.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    return date.toLocaleDateString(locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateIso;
  }
}

function scoreSlot(slot: SuggestedBookingSlot, earliestAllowed: Date): number {
  const before = slot.travelBeforeMinutes ?? 0;
  const after = slot.travelAfterMinutes ?? 0;
  const totalTravel = before + after;
  const hasBookingsToday = !!slot.hasBookingsToday;

  const dayGroupScore = hasBookingsToday ? 1 : 0.45;
  const travelScore = 1 - Math.min(totalTravel, 60) / 60;

  let proximityScore = 0.4;
  try {
    const [y, m, d] = slot.date.split('-').map(Number);
    const [sh, sm] = slot.serviceStartTime.split(':').map(Number);
    const slotDateTime = new Date(
      y || earliestAllowed.getFullYear(),
      (m || 1) - 1,
      d || 1,
      sh || 0,
      sm || 0,
      0,
      0
    );
    const deltaMinutes = Math.max(
      0,
      Math.round((slotDateTime.getTime() - earliestAllowed.getTime()) / 60000)
    );
    proximityScore = 1 - Math.min(deltaMinutes, 42 * 24 * 60) / (42 * 24 * 60);
  } catch {
    proximityScore = 0.4;
  }

  let continuityScore = 0.2;
  if (hasBookingsToday && before <= 20 && after <= 20) {
    continuityScore = 1;
  } else if (hasBookingsToday && (before <= 20 || after <= 20)) {
    continuityScore = 0.7;
  } else if (totalTravel <= 25) {
    continuityScore = 0.55;
  }

  return (
    dayGroupScore * 0.38 +
    continuityScore * 0.32 +
    travelScore * 0.2 +
    proximityScore * 0.1
  );
}

function preferSuggestion(
  current: SuggestedBookingSlot | null,
  candidate: SuggestedBookingSlot,
) {
  if (!current) return true;
  return (candidate.score ?? 0) > (current.score ?? 0);
}

export function computeScoredBookingOptionsFromAgenda(
  agenda: InstructorAgendaResponse,
  durationMinutes: number | null,
) {
  const dur = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  const earliestAllowed = getEarliestAllowedDateTime(new Date());
  const bookedSlots = agenda.bookedSlots ?? [];
  const exactSlotsById = new Map<string, SuggestedBookingSlot>();

  for (const date of Object.keys(agenda.clientSlotsByDate || {}).sort()) {
    const exactSlots = getExactBookableSlotsForDate({
      dateIso: date,
      rawSlots: agenda.clientSlotsByDate[date] || [],
      serviceDuration: dur,
      earliestAllowed,
    });

    const hasBookingsToday = bookedSlots.some((slot) => slot.date === date);

    for (const exactSlot of exactSlots) {
      const suggestion: SuggestedBookingSlot = {
        ...exactSlot,
        hasBookingsToday,
      };
      const scoredSuggestion: SuggestedBookingSlot = {
        ...suggestion,
        score: scoreSlot(suggestion, earliestAllowed),
      };

      const current = exactSlotsById.get(scoredSuggestion.id) ?? null;
      if (preferSuggestion(current, scoredSuggestion)) {
        exactSlotsById.set(scoredSuggestion.id, scoredSuggestion);
      }
    }
  }

  return Array.from(exactSlotsById.values()).sort(
    (left, right) => (right.score ?? 0) - (left.score ?? 0)
  );
}

export function computeSuggestionsFromAgenda(
  agenda: InstructorAgendaResponse,
  durationMinutes: number | null,
  count = 4,
) {
  const scoredSlots = computeScoredBookingOptionsFromAgenda(
    agenda,
    durationMinutes
  );

  if (!scoredSlots.length) {
    return [];
  }

  const shortlist: SuggestedBookingSlot[] = [];
  const selectedDays = new Map<string, number>();

  for (const slot of scoredSlots) {
    const occurrences = selectedDays.get(slot.date) ?? 0;
    const canReuseDay = shortlist.length >= 2 ? occurrences < 2 : occurrences < 1;

    if (!canReuseDay) {
      continue;
    }

    shortlist.push(slot);
    selectedDays.set(slot.date, occurrences + 1);

    if (shortlist.length >= count) {
      break;
    }
  }

  if (shortlist.length >= count) {
    return shortlist;
  }

  const pickedIds = new Set(shortlist.map((slot) => slot.id));
  for (const slot of scoredSlots) {
    if (pickedIds.has(slot.id)) continue;
    shortlist.push(slot);
    if (shortlist.length >= count) {
      break;
    }
  }

  return shortlist;
}

export function buildSuggestionReason(
  slot: SuggestedBookingSlot,
  t: SuggestionTranslator,
) {
  const before = slot.travelBeforeMinutes ?? 0;
  const after = slot.travelAfterMinutes ?? 0;
  const totalTravel = before + after;

  if (slot.hasBookingsToday && before <= 20 && after <= 20) {
    return t('reason.fluidVisit');
  }

  if (totalTravel <= 20) {
    return t('reason.reduceTravel');
  }

  if (slot.hasBookingsToday && (before <= 20 || after <= 20)) {
    return t('reason.dayFlow');
  }

  if (slot.hasBookingsToday) {
    return t('reason.fitSchedule');
  }

  return t('reason.smoothOption');
}

export function buildSuggestionTimeRange(
  slot: SuggestedBookingSlot,
  locale: string,
) {
  return `${formatTimeForLocale(slot.serviceStartTime, locale)} - ${formatTimeForLocale(
    slot.serviceEndTime,
    locale
  )}`;
}

export function findNearbyBetterSuggestion(params: {
  currentSlot: SuggestedBookingSlot;
  scoredSlots: SuggestedBookingSlot[];
  maxGapMinutes?: number;
  minScoreDelta?: number;
}) {
  const {
    currentSlot,
    scoredSlots,
    maxGapMinutes = 30,
    minScoreDelta = 0.12,
  } = params;

  const currentScore = currentSlot.score ?? 0;
  const currentStartMinutes = Number(
    currentSlot.serviceStartTime.split(':')[0]
  ) * 60 + Number(currentSlot.serviceStartTime.split(':')[1]);

  return (
    scoredSlots.find((slot) => {
      if (slot.id === currentSlot.id || slot.date !== currentSlot.date) {
        return false;
      }

      const slotStartMinutes =
        Number(slot.serviceStartTime.split(':')[0]) * 60 +
        Number(slot.serviceStartTime.split(':')[1]);

      return (
        Math.abs(slotStartMinutes - currentStartMinutes) <= maxGapMinutes &&
        (slot.score ?? 0) >= currentScore + minScoreDelta
      );
    }) ?? null
  );
}
