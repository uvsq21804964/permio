'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

type Kind = 'available' | 'unavailable';
type ServiceAlignment = 'start' | 'end';

type DefaultAvailability = {
  id: string;
  userId: string;
  dayOfWeek: number; // 0 = Lundi ... 6 = Dimanche
  startTime: string;
  endTime: string;
};

type SelectedSlot = {
  date: string;

  // Fenêtre possible chez le client (après retrait des trajets)
  windowStartTime: string;
  windowEndTime: string;

  // Créneau précis du service (durée = durée du service)
  serviceStartTime: string;
  serviceEndTime: string;

  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;

  alignment: ServiceAlignment;
};

type ClientSlot = {
  startTime: string;
  endTime: string;
  travelBeforeMinutes: number;
  travelAfterMinutes: number;
  fromLabel: string;
  toLabel: string;
};

type DayException = {
  id: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string;
  endTime: string;
  kind: Kind;
};

type BookedSlot = {
  id: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

type TimeRange = { startTime: string; endTime: string };

type WeeklyAgendaResponse = {
  weekStart: string;
  weekEnd: string;
  instructor: {
    id: string;
    name: string | null;
    role: string;
    formatted_address: string | null;
    lat: number | null;
    lng: number | null;
    street: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    country_code: string | null;
    google_place_id: string | null;
    raw_input: string | null;
    address_label: string | null;
    is_primary: boolean;
  };
  client: {
    id: string;
    name: string | null;
    role: string;
    formatted_address: string | null;
    lat: number | null;
    lng: number | null;
    street: string | null;
    street_number: string | null;
    postal_code: string | null;
    city: string | null;
    country: string | null;
    country_code: string | null;
    google_place_id: string | null;
    raw_input: string | null;
    address_label: string | null;
    is_primary: boolean;
  };
  defaults: DefaultAvailability[];
  exceptions: DayException[];
  bookedSlots: BookedSlot[];

  // Créneaux déjà ajustés pour CE client
  clientSlotsByDate: Record<string, ClientSlot[]>;
};

type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

type ServicePricing = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: string;
  includes_transport: boolean;
};

type ServicesApiResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

type Interval = { start: number; end: number };

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

const START_HOUR = 8;
const END_HOUR = 20;
const PIXELS_PER_HOUR = 60;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => i + START_HOUR
);

const DAY_LABELS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function isoToDateOnly(iso: string): Date {
  const base = iso.slice(0, 10);
  const [yStr, mStr, dStr] = base.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);
  return new Date(y, (m || 1) - 1, d || 1);
}

function dateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDayAndDate(iso: string): string {
  const d = isoToDateOnly(iso);
  const dow = d.getDay(); // 0 = dim, 1 = lun, ...
  const idx = dow === 0 ? 6 : dow - 1; // 0 = Lun, 6 = Dim
  return `${DAY_LABELS_SHORT[idx]} ${formatDDMM(iso)}`;
}

function startOfWeekMondayISO(base?: string): string {
  const d = base ? isoToDateOnly(base) : new Date();
  const dow = d.getDay(); // 0..6 (0=dim)
  const isoDow = dow === 0 ? 7 : dow;
  const diff = isoDow - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return dateToISO(d);
}

function addDaysISO(iso: string, delta: number): string {
  const d = isoToDateOnly(iso);
  d.setDate(d.getDate() + delta);
  return dateToISO(d);
}

function formatDDMM(iso: string): string {
  const d = isoToDateOnly(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1
  ).padStart(2, '0')}`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function getBlockStyle(startTime: string, endTime: string) {
  const startM = timeToMinutes(startTime);
  const endM = timeToMinutes(endTime);
  const offsetFromStart = startM - START_HOUR * 60;
  const duration = endM - startM;

  const top = (offsetFromStart / 60) * PIXELS_PER_HOUR;
  const height = (duration / 60) * PIXELS_PER_HOUR;

  return { top, height };
}

function getExceptionColor(kind: Kind) {
  if (kind === 'available') {
    return 'bg-emerald-100 border-emerald-400 text-emerald-900';
  }
  return 'bg-rose-100 border-rose-400 text-rose-900';
}

/**
 * Date/heure minimale à laquelle on a le droit de réserver.
 *
 * Règles :
 * - Avant 10h → aujourd’hui mais seulement à partir de 12h
 * - Entre 10h et 16h → demain à partir de 10h
 * - Après 16h → demain à partir de 12h
 */
function getEarliestAllowedDateTime(now: Date = new Date()): Date {
  const ref = new Date(now);
  ref.setSeconds(0, 0);

  const hour = ref.getHours() + ref.getMinutes() / 60;
  const earliest = new Date(ref);

  if (hour < 10) {
    earliest.setHours(12, 0, 0, 0);
  } else if (hour < 16) {
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(10, 0, 0, 0);
  } else {
    earliest.setDate(earliest.getDate() + 1);
    earliest.setHours(12, 0, 0, 0);
  }

  return earliest;
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

export default function BookPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const selectedServiceId = searchParams.get('serviceId');

  // Semaine actuelle (lundi) et bornes min/max de navigation
  const [todayWeekStart] = useState(() => startOfWeekMondayISO());
  const [maxWeekStart] = useState(() =>
    addDaysISO(startOfWeekMondayISO(), 40 * 7)
  );

  const [weekStart, setWeekStart] = useState<string>(() =>
    startOfWeekMondayISO()
  );
  const weekEnd = useMemo(() => addDaysISO(weekStart, 6), [weekStart]);

  const [data, setData] = useState<WeeklyAgendaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [agendaReloadKey, setAgendaReloadKey] = useState(0);

  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<{
    id: number;
    name: string;
    categoryName: string;
    durationMinutes: number | null;
  } | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const [serviceAlignment, setServiceAlignment] =
    useState<ServiceAlignment>('start');

  // Modal d’alignement
  const [alignmentDialogOpen, setAlignmentDialogOpen] = useState(false);
  const [alignmentChoice, setAlignmentChoice] =
    useState<ServiceAlignment>('start');

  // Référence temporelle
  const earliestAllowed = useMemo(() => getEarliestAllowedDateTime(), []);
  const now = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => dateToISO(new Date()), []);
  const isCurrentWeek = weekStart === todayWeekStart;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMinutes - START_HOUR * 60) / 60) * PIXELS_PER_HOUR;
  const showNowLine =
    isCurrentWeek &&
    nowMinutes >= START_HOUR * 60 &&
    nowMinutes <= END_HOUR * 60;

  const canGoPrevWeek = weekStart > todayWeekStart;
  const canGoNextWeek = weekStart < maxWeekStart;

  // Juste pour info si besoin
  const bookedSlotsByDate = useMemo(() => {
    const map: Record<string, BookedSlot[]> = {};
    if (!data?.bookedSlots) return map;

    for (const s of data.bookedSlots) {
      const key = (s.date || '').slice(0, 10);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }

    return map;
  }, [data]);

  const addrParam = searchParams.get('addr');

  const [bookingAddress, setBookingAddress] = useState<BookingAddress | null>(
    null
  );

  useEffect(() => {
    const addrParam = searchParams.get('addr');
    let addr: BookingAddress | null = null;

    if (addrParam) {
      try {
        const json = decodeURIComponent(addrParam);
        addr = JSON.parse(json);
        setBookingAddress(addr);
      } catch (e) {
        console.error('Invalid addr param', e);
      }
    }
  }, [addrParam, searchParams]);

  // Charger l’agenda hebdo du moniteur
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!bookingAddress) return;

    const fetchAgenda = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const json = (await res.json()) as WeeklyAgendaResponse;
        setData(json);
      } catch (e: any) {
        console.error(e);
        setError(
          e?.message || 'Erreur lors du chargement de l’agenda du moniteur.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, [weekStart, isLoaded, isSignedIn, bookingAddress, agendaReloadKey]);

  // Charger les infos du service sélectionné (nom + catégorie)
  useEffect(() => {
    if (!selectedServiceId) {
      setSelectedService(null);
      setServiceError(null);
      return;
    }

    const numericId = Number(selectedServiceId);
    if (!Number.isFinite(numericId)) {
      setSelectedService(null);
      setServiceError('Service invalide dans l’URL.');
      return;
    }

    const loadService = async () => {
      try {
        setServiceLoading(true);
        setServiceError(null);
        setSelectedService(null);

        const res = await fetch('/api/me/instructor-services', {
          credentials: 'include',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || 'Impossible de récupérer la liste des services.'
          );
        }

        const data: ServicesApiResponse = await res.json();
        const service = (data.services || []).find((s) => s.id === numericId);

        if (!service) {
          setServiceError(
            "Le service sélectionné n'existe pas ou n'est pas disponible."
          );
          setSelectedService(null);
          router.push('/book/services');
          return;
        }

        setSelectedService({
          id: service.id,
          name: service.name,
          categoryName: service.category_name,
          durationMinutes: service.duration_minutes,
        });
      } catch (e: any) {
        console.error('Error fetching selected service', e);
        setServiceError(
          e?.message || 'Impossible de récupérer le service sélectionné.'
        );
      } finally {
        setServiceLoading(false);
      }
    };

    loadService();
  }, [selectedServiceId, router]);

  // Recalcule les horaires du service si on change l’alignement
  useEffect(() => {
    if (!selectedService?.durationMinutes) return;

    setSelectedSlot((prev) => {
      if (!prev) return prev;

      const { serviceStartTime, serviceEndTime } = computeServiceTimes(
        prev.windowStartTime,
        prev.windowEndTime,
        selectedService.durationMinutes!,
        serviceAlignment
      );

      // Si rien ne change, ne pas déclencher un nouveau render
      if (
        prev.serviceStartTime === serviceStartTime &&
        prev.serviceEndTime === serviceEndTime &&
        prev.alignment === serviceAlignment
      ) {
        return prev;
      }

      return {
        ...prev,
        serviceStartTime,
        serviceEndTime,
        alignment: serviceAlignment,
      };
    });
  }, [serviceAlignment, selectedService?.durationMinutes]);

  const handleSelectSlot = (dateIso: string, slot: ClientSlot) => {
    const serviceDuration = selectedService?.durationMinutes ?? null;

    let serviceStartTime = slot.startTime;
    let serviceEndTime = slot.endTime;

    if (serviceDuration && serviceDuration > 0) {
      const times = computeServiceTimes(
        slot.startTime,
        slot.endTime,
        serviceDuration,
        serviceAlignment
      );
      serviceStartTime = times.serviceStartTime;
      serviceEndTime = times.serviceEndTime;
    }

    const newSelected: SelectedSlot = {
      date: dateIso,
      windowStartTime: slot.startTime,
      windowEndTime: slot.endTime,
      serviceStartTime,
      serviceEndTime,
      travelBeforeMinutes: slot.travelBeforeMinutes,
      travelAfterMinutes: slot.travelAfterMinutes,
      fromLabel: slot.fromLabel,
      toLabel: slot.toLabel,
      alignment: serviceAlignment,
    };

    setSelectedSlot(newSelected);

    console.log('[BOOKING] Créneau sélectionné', {
      serviceId: selectedService?.id,
      alignment: serviceAlignment,
      slot: newSelected,
    });
  };

  const handleConfirmBooking = async (overrideSlot?: SelectedSlot) => {
    setBookingError(null);
    setNotice(null);

    if (!selectedService) {
      setBookingError('Veuillez d’abord sélectionner un service.');
      return;
    }

    const slot = overrideSlot ?? selectedSlot;

    if (!slot) {
      setBookingError(
        'Veuillez d’abord sélectionner un créneau dans l’agenda.'
      );
      return;
    }

    if (!slot.serviceStartTime || !slot.serviceEndTime) {
      setBookingError(
        'Le créneau sélectionné est invalide. Veuillez en choisir un autre ou définir son alignement.'
      );
      return;
    }

    try {
      setBookingLoading(true);

      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: selectedService.id,
          date: slot.date,
          startTime: slot.serviceStartTime,
          endTime: slot.serviceEndTime,
          bookingAddress: bookingAddress
            ? {
                formattedAddress: bookingAddress.formattedAddress,
                lat: bookingAddress.lat,
                lng: bookingAddress.lng,
                street: bookingAddress.street,
                streetNumber: bookingAddress.streetNumber,
                postalCode: bookingAddress.postalCode,
                city: bookingAddress.city,
                country: bookingAddress.country,
                countryCode: bookingAddress.countryCode,
                googlePlaceId: bookingAddress.googlePlaceId,
              }
            : undefined,
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
      console.log('[BOOKING] Slot créé', json);

      setNotice('Créneau réservé avec succès ✅');

      // On vide la sélection et on force le rechargement de l’agenda
      setSelectedSlot(null);
      setAgendaReloadKey((prev) => prev + 1);
    } catch (e: any) {
      console.error('[BOOKING] error', e);
      setBookingError(
        e?.message || 'Erreur lors de la création du créneau. Réessayez.'
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i)),
    [weekStart]
  );

  /**
   * Jours "non réservables" : aucun créneau >= earliestAllowed
   * et respectant la durée du service.
   */
  const dayDisabled = useMemo(() => {
    const result: Record<string, boolean> = {};
    if (!data) return result;

    for (const dateIso of weekDates) {
      const clientSlotsForDay: ClientSlot[] =
        data.clientSlotsByDate?.[dateIso] ?? [];
      if (!clientSlotsForDay.length) {
        result[dateIso] = true;
        continue;
      }

      let slots = [...clientSlotsForDay];

      if (selectedService?.durationMinutes != null) {
        const dur = selectedService.durationMinutes;
        slots = slots.filter((slot) => {
          const duration =
            timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime);
          return duration >= dur;
        });
      }

      const [y, m, d] = dateIso.split('-').map(Number);

      slots = slots.filter((slot) => {
        const [hStr, mStr] = slot.startTime.split(':');
        const hh = Number(hStr) || 0;
        const mm = Number(mStr) || 0;
        const slotDateTime = new Date(
          y || earliestAllowed.getFullYear(),
          (m || 1) - 1,
          d || 1,
          hh,
          mm,
          0,
          0
        );
        return slotDateTime >= earliestAllowed;
      });

      result[dateIso] = slots.length === 0;
    }

    return result;
  }, [data, weekDates, selectedService?.durationMinutes, earliestAllowed]);

  const handlePrevWeek = () => {
    setWeekStart((prev) => {
      const newWeek = addDaysISO(prev, -7);
      if (newWeek < todayWeekStart) return prev;
      return newWeek;
    });
    setSelectedSlot(null);
    setBookingLoading(false);
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => {
      const newWeek = addDaysISO(prev, 7);
      if (newWeek > maxWeekStart) return prev;
      return newWeek;
    });
    setSelectedSlot(null);
    setBookingLoading(false);
  };

  const handleOpenAlignmentDialog = () => {
    if (!selectedSlot) return;
    if (!selectedService?.durationMinutes) {
      setBookingError(
        "Ce service n'a pas de durée définie. Impossible d'ajuster son alignement dans le créneau."
      );
      return;
    }
    setAlignmentChoice(serviceAlignment);
    setAlignmentDialogOpen(true);
  };

  const handleConfirmAlignmentChoice = () => {
    if (!selectedSlot || !selectedService?.durationMinutes) {
      setAlignmentDialogOpen(false);
      return;
    }

    const { serviceStartTime, serviceEndTime } = computeServiceTimes(
      selectedSlot.windowStartTime,
      selectedSlot.windowEndTime,
      selectedService.durationMinutes,
      alignmentChoice
    );

    const updatedSlot: SelectedSlot = {
      ...selectedSlot,
      serviceStartTime,
      serviceEndTime,
      alignment: alignmentChoice,
    };

    setSelectedSlot(updatedSlot);
    setServiceAlignment(alignmentChoice);
    setAlignmentDialogOpen(false);

    void handleConfirmBooking(updatedSlot);
  };

  let content: React.ReactNode;

  if (!isLoaded) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        Chargement de votre session…
      </div>
    );
  } else if (!isSignedIn) {
    content = (
      <div className="p-6 text-sm text-muted-foreground">
        Vous devez être connecté pour voir les disponibilités de votre moniteur.
      </div>
    );
  } else {
    content = (
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              disabled={!canGoPrevWeek}
            >
              ← Semaine précédente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              disabled={!canGoNextWeek}
            >
              Semaine suivante →
            </Button>
          </div>

          <Button
            size="sm"
            onClick={handleOpenAlignmentDialog}
            disabled={bookingLoading || !selectedService || !selectedSlot}
          >
            Placer ma réservation sur ce créneau
          </Button>
        </div>

        {notice && (
          <Alert>
            <AlertDescription className="text-sm">{notice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {bookingError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {bookingError}
            </AlertDescription>
          </Alert>
        )}

        {serviceError && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">
              {serviceError}
            </AlertDescription>
          </Alert>
        )}

        {/* Agenda hebdo */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle>Agenda de votre moniteur</CardTitle>
              <p className="text-sm text-muted-foreground">
                Semaine du{' '}
                <span className="font-medium">{formatDDMM(weekStart)}</span> au{' '}
                <span className="font-medium">{formatDDMM(weekEnd)}</span>.
              </p>
              <p className="text-xs text-muted-foreground">
                Les créneaux affichés tiennent compte de ses autres rendez-vous
                et du temps de trajet nécessaire pour venir chez vous. Les jours
                sans aucun créneau réservable sont légèrement grisés.
              </p>
            </div>
          </CardHeader>

          <CardContent>
            {loading || !data ? (
              <div className="py-8 text-sm text-muted-foreground">
                Chargement des créneaux disponibles…
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Header ligne jours */}
                  <div className="grid grid-cols-8">
                    <div className="p-2 border-b text-sm font-medium text-muted-foreground">
                      Heure
                    </div>
                    {weekDates.map((dateIso, idx) => {
                      const isDisabledDay = dayDisabled[dateIso] ?? false;
                      const isToday = dateIso === todayIso;

                      return (
                        <div
                          key={dateIso}
                          className={`p-2 border-b border-l text-center text-xs md:text-sm font-medium
                            ${
                              isDisabledDay
                                ? 'bg-muted/40 text-muted-foreground'
                                : ''
                            }
                            ${
                              isToday && isCurrentWeek
                                ? 'border-b-2 border-b-primary'
                                : ''
                            }
                          `}
                        >
                          <div>{DAY_LABELS_SHORT[idx]}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {formatDDMM(dateIso)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grille */}
                  <div className="grid grid-cols-8">
                    {/* Colonne heures */}
                    <div className="border-r">
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="border-b text-xs md:text-sm text-muted-foreground px-2 flex items-start"
                          style={{ height: `${PIXELS_PER_HOUR}px` }}
                        >
                          {h}:00
                        </div>
                      ))}
                    </div>

                    {/* Colonnes jours */}
                    {weekDates.map((dateIso) => {
                      const clientSlotsForDay: ClientSlot[] =
                        data.clientSlotsByDate?.[dateIso] ?? [];

                      let availableSlots: ClientSlot[] = [...clientSlotsForDay];

                      if (selectedService?.durationMinutes != null) {
                        const serviceDuration = selectedService.durationMinutes;

                        availableSlots = availableSlots.filter((slot) => {
                          const duration =
                            timeToMinutes(slot.endTime) -
                            timeToMinutes(slot.startTime);
                          return duration >= serviceDuration;
                        });
                      }

                      const [y, m, d] = dateIso.split('-').map(Number);

                      // Filtre temporel : slot >= earliestAllowed
                      availableSlots = availableSlots.filter((slot) => {
                        const [hStr, mStr] = slot.startTime.split(':');
                        const hh = Number(hStr) || 0;
                        const mm = Number(mStr) || 0;

                        const slotDateTime = new Date(
                          y || earliestAllowed.getFullYear(),
                          (m || 1) - 1,
                          d || 1,
                          hh,
                          mm,
                          0,
                          0
                        );

                        return slotDateTime >= earliestAllowed;
                      });

                      const isDisabledDay = dayDisabled[dateIso] ?? false;
                      const isToday = dateIso === todayIso;

                      return (
                        <div
                          key={dateIso}
                          className={`relative border-r last:border-r-0 ${
                            isDisabledDay ? 'bg-muted/40' : ''
                          }`}
                        >
                          {/* Fond par heure */}
                          {HOURS.map((h) => (
                            <div
                              key={`${dateIso}-${h}`}
                              className="border-b bg-background/50"
                              style={{ height: `${PIXELS_PER_HOUR}px` }}
                            />
                          ))}

                          {/* Créneaux disponibles */}
                          {availableSlots.map((slot, idx) => {
                            const { top, height } = getBlockStyle(
                              slot.startTime,
                              slot.endTime
                            );
                            const colorClass = getExceptionColor('available');

                            const isSelected =
                              selectedSlot &&
                              selectedSlot.date === dateIso &&
                              selectedSlot.windowStartTime === slot.startTime &&
                              selectedSlot.windowEndTime === slot.endTime;

                            const tooltipLines = [
                              `Créneau chez vous : ${slot.startTime}–${slot.endTime}`,
                              `Trajet avant : ${slot.travelBeforeMinutes} min depuis ${slot.fromLabel}`,
                              `Trajet après : ${slot.travelAfterMinutes} min vers ${slot.toLabel}`,
                            ];

                            return (
                              <div
                                key={`${dateIso}-${idx}-${slot.startTime}-${slot.endTime}`}
                                className={`absolute left-1 right-1 rounded-md border shadow-sm cursor-pointer transition
        ${colorClass}
        ${
          isSelected
            ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background'
            : ''
        }
      `}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  minHeight: '24px',
                                }}
                                title={tooltipLines.join('\n')}
                                role="button"
                                tabIndex={0}
                                onClick={() => handleSelectSlot(dateIso, slot)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelectSlot(dateIso, slot);
                                  }
                                }}
                              >
                                <div className="flex h-full flex-col items-start justify-center px-1 py-0.5">
                                  <span className="text-[10px] leading-tight truncate">
                                    {slot.startTime} – {slot.endTime}
                                  </span>
                                  <span className="text-[8px] leading-tight uppercase opacity-80 mt-0.5">
                                    {isSelected ? 'Sélectionné' : 'Disponible'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Trait "maintenant" sur aujourd’hui, dans la semaine courante */}
                          {showNowLine && isToday && (
                            <div
                              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-primary/60"
                              style={{ top: `${nowTop}px` }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const alignmentModalContent =
    selectedSlot && selectedService?.durationMinutes ? (
      (() => {
        const startAligned = computeServiceTimes(
          selectedSlot.windowStartTime,
          selectedSlot.windowEndTime,
          selectedService.durationMinutes!,
          'start'
        );
        const endAligned = computeServiceTimes(
          selectedSlot.windowStartTime,
          selectedSlot.windowEndTime,
          selectedService.durationMinutes!,
          'end'
        );

        return (
          <>
            <DialogHeader>
              <DialogTitle>Comment placer votre service ?</DialogTitle>
              <DialogDescription>
                Pour ce créneau chez le client, choisissez si votre service doit
                commencer au début ou se terminer à la fin de la fenêtre
                disponible.
              </DialogDescription>
            </DialogHeader>
            {selectedSlot && (
              <div className="flex flex-col items-start gap-1 text-xs text-muted-foreground">
                <p>
                  Date :{' '}
                  <span className="font-medium">
                    {formatDayAndDate(selectedSlot.date)}
                  </span>
                </p>
              </div>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg border p-3 text-left text-sm transition hover:border-primary hover:bg-muted ${
                  alignmentChoice === 'start'
                    ? 'border-primary bg-muted'
                    : 'border-border'
                }`}
                onClick={() => setAlignmentChoice('start')}
              >
                <div className="font-medium text-sm">
                  Aligner sur le début du créneau
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Service de{' '}
                  <span className="font-semibold">
                    {startAligned.serviceStartTime} à{' '}
                    {startAligned.serviceEndTime}
                  </span>
                </p>
              </button>

              <button
                type="button"
                className={`rounded-lg border p-3 text-left text-sm transition hover:border-primary hover:bg-muted ${
                  alignmentChoice === 'end'
                    ? 'border-primary bg-muted'
                    : 'border-border'
                }`}
                onClick={() => setAlignmentChoice('end')}
              >
                <div className="font-medium text-sm">
                  Aligner sur la fin du créneau
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Service de{' '}
                  <span className="font-semibold">
                    {endAligned.serviceStartTime} à {endAligned.serviceEndTime}
                  </span>
                </p>
              </button>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAlignmentDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button size="sm" onClick={handleConfirmAlignmentChoice}>
                Réserver
              </Button>
            </DialogFooter>
          </>
        );
      })()
    ) : (
      <>
        <DialogHeader>
          <DialogTitle>Impossible de définir l’alignement</DialogTitle>
          <DialogDescription>
            Ce service n’a pas de durée définie ou aucun créneau n’est
            sélectionné.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlignmentDialogOpen(false)}
          >
            Fermer
          </Button>
        </DialogFooter>
      </>
    );

  return (
    <div className="min-h-screen bg-background p-6">
      {content}

      <Dialog open={alignmentDialogOpen} onOpenChange={setAlignmentDialogOpen}>
        <DialogContent className="max-w-md">
          {alignmentModalContent}
        </DialogContent>
      </Dialog>
    </div>
  );
}
