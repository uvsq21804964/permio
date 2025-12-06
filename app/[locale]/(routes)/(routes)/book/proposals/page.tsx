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
};

type ClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

type WeeklyAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  clientSlotsByDate: Record<string, ClientSlot[]>;
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

function startOfWeekMondayISO(base?: Date): string {
  const d = base ? new Date(base) : new Date();
  const day = d.getDay(); // 0 (dim) -> 6 (sam)
  const diff = day === 0 ? -6 : 1 - day; // remet sur lundi
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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
 * Fabrique 3 suggestions à partir de l'agenda réel (clientSlotsByDate)
 * en tenant compte de la durée du service.
 *
 * Heuristique simple pour éviter les trous : on aligne par défaut
 * au début de la fenêtre ("start") → le dogsitter commence le cours
 * dès son arrivée, sans attendre.
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

  for (const date of dates) {
    const [y, m, d] = date.split('-').map(Number);

    const slots = agenda.clientSlotsByDate[date] || [];
    for (const slot of slots) {
      // → date/heure du début de la fenêtre chez le client
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

      // ⛔ On ignore tous les créneaux qui ne respectent pas les règles (trop tôt / passé)
      if (slotDateTime < earliestAllowed) {
        continue;
      }

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

      results.push({
        id: `${date}-${slot.startTime}-${slot.endTime}`,
        date,
        windowStartTime: slot.startTime,
        windowEndTime: slot.endTime,
        serviceStartTime,
        serviceEndTime,
        alignment,
      });

      if (results.length >= count) break;
    }
    if (results.length >= count) break;
  }

  // On donne un score décroissant
  return results.map((s, i) => ({
    ...s,
    score: 1 - i * 0.1,
  }));
}

/**
 * Fallback mock si jamais on ne trouve rien côté backend / agenda.
 */
function generateMockSuggestions(
  durationMinutes: number | null,
  count = 3
): SuggestedSlot[] {
  const dur = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;

  const now = new Date();
  now.setSeconds(0, 0);

  // On réutilise exactement les mêmes règles que pour l’agenda réel
  const base = getEarliestAllowedDateTime(now);

  const slots: SuggestedSlot[] = [];

  for (let i = 0; i < count; i++) {
    const dateObj = new Date(base);

    // 2 premiers créneaux le même jour, les suivants les jours d’après
    dateObj.setDate(base.getDate() + Math.floor(i / 2));

    // Exemple : 10:00 / 13:00 ou 12:00 / 15:00 selon "base"
    const hourOffset = i % 2 === 0 ? 0 : 3;
    dateObj.setHours(base.getHours() + hourOffset, base.getMinutes(), 0, 0);

    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const dateIso = `${y}-${m}-${d}`;

    const startTime = dateObj.toTimeString().slice(0, 5);
    const endTime = addMinutesToTime(startTime, dur);

    const alignment: ServiceAlignment = 'start';

    slots.push({
      id: `mock-${i}-${dateIso}-${startTime}`,
      date: dateIso,
      windowStartTime: startTime,
      windowEndTime: endTime,
      serviceStartTime: startTime,
      serviceEndTime: endTime,
      alignment,
      score: 1 - i * 0.1,
    });
  }

  return slots;
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

  // Charger les suggestions à partir de l'agenda hebdo + adresse
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!selectedService || !instructorId || !bookingAddress) return;

      setLoadingSuggestions(true);
      setError(null);

      try {
        const weekStart = startOfWeekMondayISO();

        const url = new URL(
          `/api/me/instructor-weekly-agenda`,
          window.location.origin
        );
        url.searchParams.set('weekStart', weekStart);
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
        let slots = computeSuggestionsFromAgenda(
          agenda,
          selectedService.duration_minutes,
          3
        );

        // Fallback mock si jamais on ne trouve rien
        if (!slots.length) {
          slots = generateMockSuggestions(selectedService.duration_minutes, 3);
        }

        setSuggestions(slots);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message || 'Erreur lors de la génération des créneaux proposés.'
        );
        // Fallback mock pour ne pas bloquer l'utilisateur
        if (selectedService) {
          const mock = generateMockSuggestions(
            selectedService.duration_minutes,
            3
          );
          setSuggestions(mock);
        }
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
              votre dogsitter, avec un placement optimisé pour enchaîner les
              cours.
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
                    {/* Horaire du cours (aligné) */}
                    <p className="text-sm font-semibold">
                      {slot.serviceStartTime} – {slot.serviceEndTime}
                    </p>

                    <p className="text-[11px] text-muted-foreground">
                      Cours aligné au{' '}
                      {slot.alignment === 'start' ? 'début' : 'fin'} du créneau
                      pour limiter les trous entre deux interventions.
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
