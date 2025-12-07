// app/[locale]/(routes)/(routes)/book/proposals/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

type ServicePricing = {
  id: number;
  user_id: string; // instructorId / dogsitterId
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | string;
  includes_transport: boolean;
};

type ApiResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

type ServiceAlignment = 'start' | 'end';

type ClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

type BookedSlotLite = {
  date: string;
  startTime: string;
  endTime: string;
};

type WeeklyAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  clientSlotsByDate: Record<string, ClientSlot[]>;
  // renvoyé par l'API /api/me/instructor-weekly-agenda-proposals
  bookedSlots?: BookedSlotLite[];
};

type SuggestedSlot = {
  id: string;
  date: string; // YYYY-MM-DD

  // Fenêtre possible chez le client
  windowStartTime: string;
  windowEndTime: string;

  // Horaire précis du service (durée = durée du service)
  serviceStartTime: string;
  serviceEndTime: string;

  alignment: ServiceAlignment;
  score?: number;

  // Métadonnées utilisées pour le scoring et l'explication
  travelBeforeMinutes?: number;
  travelAfterMinutes?: number;
  fromLabel?: string;
  toLabel?: string;
  hasBookingsToday?: boolean;
};

type BookingAddress = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street: string;
  streetNumber: string;
  postalCode: string;
  city: string;
  country: string;
  countryCode: string;
  googlePlaceId?: string;
};

function formatPrice(price: number | string): string {
  const num = Number(price);
  if (Number.isNaN(num)) return `${price} €`;
  return `${num.toFixed(2)} €`;
}

function formatDateFR(dateIso: string): string {
  try {
    const [y, m, d] = dateIso.split('-').map(Number);
    const date = new Date(y, (m || 1) - 1, d || 1);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateIso;
  }
}

function timeToMinutes(time: string): number {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr) || 0;
  const m = Number(mStr) || 0;
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function addMinutesToTime(time: string, minutes: number): string {
  const base = timeToMinutes(time);
  const total = base + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * Calcule les horaires du service pour une fenêtre donnée
 * en fonction de l’alignement choisi (début / fin).
 */
function computeServiceTimes(
  windowStartTime: string,
  windowEndTime: string,
  serviceDuration: number,
  alignment: ServiceAlignment
) {
  const windowStartM = timeToMinutes(windowStartTime);
  const windowEndM = timeToMinutes(windowEndTime);

  let serviceStartM = windowStartM;
  let serviceEndM = windowEndM;

  if (alignment === 'start') {
    serviceStartM = windowStartM;
    serviceEndM = windowStartM + serviceDuration;
    if (serviceEndM > windowEndM) {
      serviceEndM = windowEndM;
      serviceStartM = windowEndM - serviceDuration;
    }
  } else {
    serviceEndM = windowEndM;
    serviceStartM = windowEndM - serviceDuration;
    if (serviceStartM < windowStartM) {
      serviceStartM = windowStartM;
      serviceEndM = windowStartM + serviceDuration;
    }
  }

  return {
    serviceStartTime: minutesToTime(serviceStartM),
    serviceEndTime: minutesToTime(serviceEndM),
  };
}

function getEarliestAllowedDateTime(now: Date = new Date()): Date {
  const ref = new Date(now);
  ref.setSeconds(0, 0);

  const hour = ref.getHours() + ref.getMinutes() / 60;
  const earliest = new Date(ref);

  if (hour < 10) {
    // Avant 10h → aujourd’hui mais à partir de 12h
    earliest.setHours(12, 0, 0, 0);
  } else if (hour < 16) {
    // Entre 10h et 16h → demain à partir de 10h
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(10, 0, 0, 0);
  } else {
    // Après 16h → demain à partir de 12h
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(12, 0, 0, 0);
  }

  return earliest;
}

/**
 * Scoring d'un créneau :
 * - privilégie les jours déjà travaillés (évite d’ouvrir un jour off)
 * - minimise les trajets
 * - comble les trous entre deux interventions
 * - garde une petite préférence pour ce qui est proche dans le temps
 */
function scoreSlot(slot: SuggestedSlot, earliestAllowed: Date): number {
  const before = slot.travelBeforeMinutes ?? 0;
  const after = slot.travelAfterMinutes ?? 0;
  const totalTravel = before + after;

  const hasBookingsToday = !!slot.hasBookingsToday;

  // 1) Score "jour déjà travaillé"
  const dayGroupScore = hasBookingsToday ? 1 : 0;

  // 2) Proximité temporelle par rapport à earliestAllowed
  let timeScore = 0.5;
  try {
    const [y, m, d] = slot.date.split('-').map(Number);
    const [sh, sm] = slot.serviceStartTime
      .split(':')
      .map((v) => Number(v) || 0);
    const slotDateTime = new Date(
      y || earliestAllowed.getFullYear(),
      (m || 1) - 1,
      d || 1,
      sh,
      sm,
      0,
      0
    );
    const deltaMs = slotDateTime.getTime() - earliestAllowed.getTime();
    const deltaMinutes = Math.max(0, Math.round(deltaMs / 60000));
    const MAX_DELTA_MIN = 42 * 24 * 60; // 42 jours
    const cappedDelta = Math.min(deltaMinutes, MAX_DELTA_MIN);
    timeScore = 1 - cappedDelta / MAX_DELTA_MIN;
  } catch {
    // on laisse 0.5
  }

  // 3) Score déplacement
  const MAX_TRAVEL = 60; // au-delà de 60 min = très mauvais
  const cappedTravel = Math.min(totalTravel, MAX_TRAVEL);
  const travelScore = 1 - cappedTravel / MAX_TRAVEL;

  // 4) Bonus "créneau qui comble un trou"
  let holeScore = 0;
  if (before > 0 && after > 0 && hasBookingsToday) {
    const worstSide = Math.max(before, after);
    if (worstSide <= 15) {
      holeScore = 1;
    } else if (worstSide <= 25) {
      holeScore = 0.7;
    } else if (worstSide <= 40) {
      holeScore = 0.4;
    } else {
      holeScore = 0.1;
    }
  }

  // pondérations
  const W_DAY_GROUP = 0.5; // très important de rester sur un jour déjà travaillé
  const W_HOLE = 0.25;
  const W_TRAVEL = 0.15;
  const W_TIME = 0.1;

  const finalScore =
    (W_DAY_GROUP * dayGroupScore +
      W_HOLE * holeScore +
      W_TRAVEL * travelScore +
      W_TIME * timeScore) /
    (W_DAY_GROUP + W_HOLE + W_TRAVEL + W_TIME);

  return finalScore;
}

/**
 * Texte d'explication lisible pour l'utilisateur,
 * basé sur les mêmes critères que le score.
 * ⚠️ On ne montre pas les durées chiffrées, juste la logique.
 */
function buildSuggestionExplanation(slot: SuggestedSlot): string {
  const before = slot.travelBeforeMinutes ?? 0;
  const after = slot.travelAfterMinutes ?? 0;
  const totalTravel = before + after;
  const hasBookingsToday = !!slot.hasBookingsToday;

  const reasons: string[] = [];

  // 1) Journée déjà travaillée vs ouverture d'une nouvelle journée
  if (hasBookingsToday) {
    reasons.push('se cale sur une journée où votre dogsitter a déjà des cours');
  } else {
    reasons.push(
      'reste compatible avec les autres jours de repos de votre dogsitter'
    );
  }

  // 2) Qualité des déplacements
  if (totalTravel > 0) {
    if (totalTravel <= 20) {
      reasons.push('limite fortement les déplacements de votre dogsitter');
    } else if (totalTravel <= 40) {
      reasons.push('réduit les temps de trajet par rapport à d’autres options');
    } else {
      reasons.push(
        'respecte tout de même les contraintes de déplacement de votre dogsitter'
      );
    }
  }

  // 3) Position par rapport aux autres interventions
  if (hasBookingsToday) {
    if (before > 0 && after > 0) {
      reasons.push('remplit un trou entre deux cours déjà prévus');
    } else if (before > 0 && after === 0) {
      reasons.push('s’enchaîne juste après un cours déjà prévu');
    } else if (after > 0 && before === 0) {
      reasons.push('prépare le cours suivant dans la journée');
    }
  }

  // 4) Proximité temporelle (par rapport à aujourd’hui)
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [y, m, d] = slot.date.split('-').map(Number);
    const slotDate = new Date(y || today.getFullYear(), (m || 1) - 1, d || 1);
    slotDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round(
      (slotDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays <= 1) {
      reasons.push('est proposé très rapidement');
    } else if (diffDays <= 7) {
      reasons.push('est situé dans les prochains jours');
    } else {
      reasons.push('reste dans une période relativement proche');
    }
  } catch {
    // ignore
  }

  if (!reasons.length) {
    return 'Ce créneau est suggéré car il s’intègre bien dans le planning de votre dogsitter.';
  }

  if (reasons.length === 1) {
    return `Ce créneau est suggéré car il ${reasons[0]}.`;
  }

  const last = reasons.pop();
  return `Ce créneau est suggéré car il ${reasons.join(', ')} et ${last}.`;
}

/**
 * Fabrique des suggestions à partir de l'agenda réel (clientSlotsByDate)
 * en tenant compte de la durée du service et en privilégiant
 * les jours où le dogsitter travaille déjà.
 */
function computeSuggestionsFromAgenda(
  agenda: WeeklyAgendaResponse,
  durationMinutes: number | null,
  count = 3
): SuggestedSlot[] {
  const dur = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  const results: SuggestedSlot[] = [];

  const dates = Object.keys(agenda.clientSlotsByDate || {}).sort();

  const now = new Date();
  const earliestAllowed = getEarliestAllowedDateTime(now);

  const bookedSlots = agenda.bookedSlots ?? [];

  for (const date of dates) {
    const slots = agenda.clientSlotsByDate[date] || [];
    if (!slots.length) continue;

    const hasBookingsToday = bookedSlots.some((b) => b.date === date);

    const [y, m, d] = date.split('-').map(Number);

    for (const slot of slots) {
      const [hStr, minStr] = slot.startTime.split(':');
      const h = Number(hStr) || 0;
      const min = Number(minStr) || 0;
      const slotDateTime = new Date(
        y || earliestAllowed.getFullYear(),
        (m || 1) - 1,
        d || 1,
        h,
        min,
        0,
        0
      );

      // ⛔ on ignore les créneaux dans le passé ou trop tôt vs règles métier
      if (slotDateTime < earliestAllowed) continue;

      const slotDur =
        timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
      if (slotDur < dur) continue;

      const alignment: ServiceAlignment = 'start';
      const { serviceStartTime, serviceEndTime } = computeServiceTimes(
        slot.startTime,
        slot.endTime,
        dur,
        alignment
      );

      const base: SuggestedSlot = {
        id: `${date}-${slot.startTime}-${slot.endTime}`,
        date,
        windowStartTime: slot.startTime,
        windowEndTime: slot.endTime,
        serviceStartTime,
        serviceEndTime,
        alignment,
        travelBeforeMinutes: slot.travelBeforeMinutes,
        travelAfterMinutes: slot.travelAfterMinutes,
        fromLabel: slot.fromLabel,
        toLabel: slot.toLabel,
        hasBookingsToday,
      };

      const score = scoreSlot(base, earliestAllowed);
      results.push({ ...base, score });
    }
  }

  if (!results.length) return [];

  // 1) séparer les créneaux sur jours déjà travaillés vs jours off
  const withBookings = results.filter((s) => s.hasBookingsToday);
  const withoutBookings = results.filter((s) => !s.hasBookingsToday);

  const sortByScoreDesc = (a: SuggestedSlot, b: SuggestedSlot) =>
    (b.score ?? 0) - (a.score ?? 0);

  withBookings.sort(sortByScoreDesc);
  withoutBookings.sort(sortByScoreDesc);

  let ordered: SuggestedSlot[] = [];

  if (withBookings.length >= count) {
    ordered = withBookings.slice(0, count);
  } else {
    ordered = [
      ...withBookings,
      ...withoutBookings.slice(0, count - withBookings.length),
    ];
  }

  return ordered;
}

export default function ProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const serviceIdParam = searchParams.get('serviceId');
  const addrParam = searchParams.get('addr');

  const [services, setServices] = useState<ServicePricing[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [instructorId, setInstructorId] = useState<string | null>(null);

  const [bookingAddress, setBookingAddress] = useState<BookingAddress | null>(
    null
  );

  const [loading, setLoading] = useState(true); // chargement des services
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingNotice, setBookingNotice] = useState<string | null>(null);

  // Décoder l'adresse passée depuis /book/address
  useEffect(() => {
    if (!addrParam) {
      setBookingAddress(null);
      return;
    }
    try {
      const json = decodeURIComponent(addrParam);
      const addr = JSON.parse(json) as BookingAddress;
      setBookingAddress(addr);
    } catch (e) {
      console.error('Invalid addr param in /book/proposals', e);
      setBookingAddress(null);
    }
  }, [addrParam]);

  // Charger les services du moniteur (comme sur /book/services)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/me/instructor-services', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error ||
              'Impossible de récupérer les services de votre moniteur.'
          );
        }
        const data: ApiResponse = await res.json();
        setServices(data.services || []);
        setCategories(data.categories || []);
        setInstructorId(data.instructorId || null);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message ||
            'Erreur lors du chargement des services de votre moniteur.'
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const selectedService = useMemo(() => {
    if (!serviceIdParam) return null;
    const idNum = Number(serviceIdParam);
    return services.find((s) => s.id === idNum) || null;
  }, [services, serviceIdParam]);

  // Charger les suggestions à partir de l'agenda (42 jours) + adresse
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!selectedService || !instructorId || !bookingAddress) return;

      setLoadingSuggestions(true);
      setError(null);

      try {
        const url = new URL(
          `/api/me/instructor-weekly-agenda-proposals`,
          window.location.origin
        );

        // on laisse l’API choisir la plage : 21 jours à partir d’aujourd’hui
        url.searchParams.set('clientLat', String(bookingAddress.lat));
        url.searchParams.set('clientLng', String(bookingAddress.lng));
        url.searchParams.set(
          'clientFormatted',
          bookingAddress.formattedAddress
        );

        const res = await fetch(url.toString(), { credentials: 'include' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ||
              'Impossible de récupérer les disponibilités du moniteur.'
          );
        }

        const agenda = (await res.json()) as WeeklyAgendaResponse;
        const slots = computeSuggestionsFromAgenda(
          agenda,
          selectedService.duration_minutes,
          3
        );

        setSuggestions(slots);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message || 'Erreur lors de la génération des créneaux proposés.'
        );
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [selectedService, instructorId, bookingAddress]);

  const handleBookSlot = async (slot: SuggestedSlot) => {
    if (!selectedService) return;

    setBookingError(null);
    setBookingNotice(null);

    try {
      setBookingLoading(true);

      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: slot.date,
          startTime: slot.serviceStartTime,
          endTime: slot.serviceEndTime,
          // plus tard : bookingAddressOverride si tu l'ajoutes côté API
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body?.error === 'SLOT_ALREADY_EXISTS') {
          throw new Error(
            'Ce créneau a déjà été réservé entre-temps. Veuillez en choisir un autre.'
          );
        }
        throw new Error(
          body?.error ||
            'Impossible de créer la réservation. Veuillez réessayer.'
        );
      }

      const json = await res.json().catch(() => ({}));
      console.log('[PROPOSALS BOOKING] Slot créé', json);
      setBookingNotice('Créneau réservé avec succès ✅');

      // Optionnel : nettoyage local
      setSuggestions((prev) => prev.filter((s) => s.id !== slot.id));

      // 🔥 Redirection vers la semaine du dogsitter
      router.push('/myweek');
    } catch (e: any) {
      console.error('[PROPOSALS BOOKING] error', e);
      setBookingError(
        e?.message || 'Erreur lors de la création du créneau. Réessayez.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSeeAllSlots = () => {
    if (!selectedService) {
      router.push('/book');
      return;
    }
    const params = new URLSearchParams({
      serviceId: String(selectedService.id),
    });
    if (addrParam) {
      params.set('addr', addrParam);
    }
    router.push(`/book?${params.toString()}`);
  };

  if (!serviceIdParam) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-sm text-muted-foreground space-y-3">
          <p>Aucun service sélectionné.</p>
          <button
            type="button"
            onClick={() => router.push('/book/services')}
            className="text-primary text-xs underline"
          >
            Retour à la sélection de services
          </button>
        </div>
      </main>
    );
  }

  if (!bookingAddress) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-3 text-sm">
          <p className="text-red-600">
            Impossible de retrouver votre adresse pour calculer les créneaux
            proposés.
          </p>
          <button
            type="button"
            onClick={() =>
              router.push(`/book/address?serviceId=${serviceIdParam}`)
            }
            className="text-primary text-xs underline"
          >
            Revenir à l&apos;étape adresse
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-64 rounded bg-muted" />
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-3 mt-4">
            <div className="h-28 rounded-lg bg-muted" />
            <div className="h-28 rounded-lg bg-muted" />
            <div className="h-28 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !selectedService) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 space-y-3 text-sm">
          <p className="text-red-600">
            {error ||
              'Impossible de retrouver le service sélectionné. Veuillez réessayer.'}
          </p>
          <button
            type="button"
            onClick={() => router.push('/book/services')}
            className="text-primary text-xs underline"
          >
            Retour à la sélection de services
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        {/* En-tête */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-semibold">
              Choisir un créneau recommandé
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Ces créneaux tiennent compte de votre adresse et de l’agenda de
              votre dogsitter, avec un placement optimisé pour limiter les
              déplacements et éviter de casser ses jours de repos.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSeeAllSlots}
            className="text-xs md:text-sm inline-flex items-center rounded-full border border-primary/40 px-3 py-1 text-primary hover:bg-primary/5 transition"
          >
            Voir toutes les disponibilités
          </button>
        </header>

        {/* Messages réservation */}
        {(bookingNotice || bookingError) && (
          <section className="text-xs md:text-sm space-y-1">
            {bookingNotice && (
              <p className="text-emerald-600">{bookingNotice}</p>
            )}
            {bookingError && <p className="text-red-600">{bookingError}</p>}
          </section>
        )}

        {/* Rappel du service choisi */}
        <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-1 text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Service sélectionné
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium break-words">{selectedService.name}</p>
              {selectedService.description && (
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {selectedService.description}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end text-xs">
              <span className="font-semibold">
                {formatPrice(selectedService.price)}
              </span>
              {selectedService.duration_minutes != null && (
                <span className="text-muted-foreground">
                  {selectedService.duration_minutes} min
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Rappel adresse */}
        <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-1 text-xs md:text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Adresse utilisée pour le calcul
          </p>
          <p className="font-medium">{bookingAddress.formattedAddress}</p>
          <p className="text-muted-foreground">
            {bookingAddress.postalCode} {bookingAddress.city} (
            {bookingAddress.country})
          </p>
        </section>

        {/* Suggestions de créneaux */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm md:text-base font-semibold">
              Créneaux recommandés
            </h2>
            {loadingSuggestions && (
              <span className="text-xs text-muted-foreground">
                Calcul des meilleurs créneaux…
              </span>
            )}
          </div>

          {suggestions.length === 0 && !loadingSuggestions && (
            <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
              Aucun créneau recommandé pour le moment. Vous pouvez consulter
              l’ensemble des disponibilités dans l’agenda.
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {suggestions.slice(0, 3).map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleBookSlot(slot)}
                  disabled={bookingLoading}
                  className="text-left rounded-2xl border bg-card p-3 md:p-4 flex flex-col justify-between hover:border-primary hover:shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {formatDateFR(slot.date)}
                    </p>
                    {/* Horaire du cours */}
                    <p className="text-sm font-semibold">
                      {slot.serviceStartTime} – {slot.serviceEndTime}
                    </p>

                    {/* Explication qualitative (pas de détails chiffrés) */}
                    <p className="text-[11px] text-muted-foreground">
                      {buildSuggestionExplanation(slot)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px]">
                    <span className="inline-flex items-center rounded-full bg-primary/5 border border-primary/20 px-2 py-0.5 text-primary font-medium">
                      {bookingLoading
                        ? 'Réservation en cours…'
                        : 'Choisir et réserver ce créneau'}
                    </span>
                    {slot.score != null && (
                      <span className="text-muted-foreground">
                        Score : {(slot.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Lien secondaire : toutes les dispo */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSeeAllSlots}
            className="text-xs text-muted-foreground underline hover:text-primary"
          >
            Ou voir toutes les disponibilités dans l’agenda
          </button>
        </div>
      </div>
    </main>
  );
}
