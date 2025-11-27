'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';

type UserProfile = {
  id: string;
  name: string;
  role: string;
  agencyId: string;
  planned_minutes: number;
  remaining_minutes: number;
  last_validated_week_start: string | null;
  last_validated_at: string | null;
  createdAt: string;
  updatedAt: string;

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
  is_primary: boolean | null;
};

type AddressDetails = {
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

declare global {
  interface Window {
    google: any;
  }
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function formatMinutesToHours(min: number | null | undefined) {
  if (min == null) return '—';
  const m = Math.max(0, min);
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} min`;
  if (rest === 0) return `${h} h`;
  return `${h} h ${rest} min`;
}

function extractComponent(
  components: any[] | undefined,
  type: string,
  useShort?: boolean
): string {
  if (!components) return '';
  const found = components.find((c) => c.types?.includes(type));
  if (!found) return '';
  return useShort ? found.short_name ?? '' : found.long_name ?? '';
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Draft nom
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Draft adresse via Google
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null
  );
  const [draftLabel, setDraftLabel] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Google Maps script ready
  const [isMapsReady, setIsMapsReady] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/me/profile');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load profile');
      }
      const data = await res.json();
      setProfile(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Impossible de charger le profil');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // ─────────────  Initialisation Autocomplete pour la modale d'adresse  ─────────────

  useEffect(() => {
    if (!addressModalOpen) return; // modale fermée -> on ne fait rien
    if (!isMapsReady) return;
    if (!window.google) {
      console.warn('Google Maps JS API pas encore disponible.');
      return;
    }
    if (!addressInputRef.current) return;

    const maps = window.google.maps;
    const places = maps.places;
    if (!places) {
      console.error('La librairie Places ne semble pas chargée.');
      return;
    }

    const options: any = {
      types: ['address'],
      fields: [
        'formatted_address',
        'geometry',
        'address_components',
        'place_id',
      ],
      // componentRestrictions: { country: 'fr' },
    };

    const autocomplete = new places.Autocomplete(
      addressInputRef.current,
      options
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        setAddressError(
          'Impossible de récupérer la géolocalisation de cette adresse.'
        );
        setSelectedAddress(null);
        return;
      }

      const comps = place.address_components;

      const addr: AddressDetails = {
        formattedAddress: place.formatted_address ?? addressInput,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        street: extractComponent(comps, 'route'),
        streetNumber: extractComponent(comps, 'street_number'),
        postalCode: extractComponent(comps, 'postal_code'),
        city:
          extractComponent(comps, 'locality') ||
          extractComponent(comps, 'postal_town'),
        country: extractComponent(comps, 'country'),
        countryCode: extractComponent(comps, 'country', true),
        googlePlaceId: place.place_id,
      };

      setAddressInput(addr.formattedAddress);
      setSelectedAddress(addr);
      setAddressError(null);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [addressModalOpen, isMapsReady]); // 👈 remove addressInput here

  useEffect(() => {
    if (!isMapsReady) return;
    if (!profile) return;
    if (profile.lat == null || profile.lng == null) return;
    if (!mapContainerRef.current) return;
    if (!window.google || !window.google.maps) return;

    const maps = window.google.maps;
    const position = { lat: profile.lat, lng: profile.lng };

    // Initialise la carte dans le conteneur
    const map = new maps.Map(mapContainerRef.current, {
      center: position,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
    });

    // Ajoute un marqueur sur l'adresse
    new maps.Marker({
      position,
      map,
    });

    // Optionnel : retour de cleanup (pas forcément indispensable ici)
    return () => {
      // Rien de spécial à nettoyer, Google Maps gère l’instance,
      // mais tu peux vider le conteneur si tu veux.
    };
  }, [isMapsReady, profile]);

  // ─────────────  Handlers modale nom  ─────────────

  const openNameModal = () => {
    if (!profile) return;
    setDraftName(profile.name || '');
    setNameError(null);
    setSuccessMessage(null);
    setNameModalOpen(true);
  };

  const closeNameModal = () => {
    if (savingName) return;
    setNameModalOpen(false);
  };

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!draftName.trim()) {
      setNameError('Le nom ne peut pas être vide.');
      return;
    }

    try {
      setSavingName(true);
      setNameError(null);

      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draftName.trim(),
          planned_minutes: profile.planned_minutes,
          address_label: profile.address_label,
          formatted_address: profile.formatted_address,
          street: profile.street,
          street_number: profile.street_number,
          postal_code: profile.postal_code,
          city: profile.city,
          country: profile.country,
          country_code: profile.country_code,
          // Si ton API gère lat/lng etc. tu peux les renvoyer aussi ici
          lat: profile.lat,
          lng: profile.lng,
          google_place_id: profile.google_place_id,
          raw_input: profile.raw_input,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update name');
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccessMessage('Nom mis à jour avec succès.');
      setNameModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setNameError(err?.message || 'Erreur lors de la mise à jour du nom.');
    } finally {
      setSavingName(false);
    }
  };

  // ─────────────  Handlers modale adresse  ─────────────

  const openAddressModal = () => {
    if (!profile) return;
    setDraftLabel(profile.address_label || '');
    setAddressInput(profile.formatted_address || '');
    setSelectedAddress(null); // On force l'utilisateur à revalider une adresse
    setAddressError(null);
    setSuccessMessage(null);
    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (savingAddress) return;
    setAddressModalOpen(false);
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!selectedAddress) {
      setAddressError(
        'Merci de choisir une adresse dans les suggestions Google avant de continuer.'
      );
      return;
    }

    try {
      setSavingAddress(true);
      setAddressError(null);

      const res = await fetch('/api/me/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // on renvoie aussi les autres infos pour ne pas les écraser
          name: profile.name,
          planned_minutes: profile.planned_minutes,
          address_label: draftLabel || null,
          formatted_address: selectedAddress.formattedAddress,
          street: selectedAddress.street,
          street_number: selectedAddress.streetNumber,
          postal_code: selectedAddress.postalCode,
          city: selectedAddress.city,
          country: selectedAddress.country,
          country_code: selectedAddress.countryCode || null,

          // 👇 TRÈS IMPORTANT : lat / lng / place_id / raw_input
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
          google_place_id: selectedAddress.googlePlaceId || null,
          raw_input: addressInput,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update address');
      }

      const data = await res.json();
      setProfile(data.user); // => ici, lat/lng devraient être remplis après MAJ
      setSuccessMessage('Adresse mise à jour avec succès.');
      setAddressModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setAddressError(
        err?.message || 'Erreur lors de la mise à jour de l’adresse.'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // ─────────────  UI STATES  ─────────────

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-xl border bg-card p-6 shadow-sm animate-pulse space-y-4">
          <div className="flex gap-4">
            <div className="h-14 w-14 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-24 rounded bg-muted" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-16 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
          <p className="text-sm text-red-600">
            Impossible de charger le profil utilisateur.
          </p>
          <button
            onClick={loadProfile}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Réessayer
          </button>
        </div>
      </main>
    );
  }

  const initials =
    profile.name
      ?.trim()
      ?.split(' ')
      ?.map((p) => p[0])
      ?.join('')
      ?.toUpperCase() || profile.id.slice(0, 2).toUpperCase();

  // ─────────────  RENDER  ─────────────

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      {/* Script Google Maps + Places pour cette page */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => console.error('Erreur de chargement Google Maps', e)}
      />

      <div className="w-full max-w-5xl space-y-6">
        {/* HEADER + RÉSUMÉ */}
        <section className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </div>
            <div className="space-y-1">
              <h1 className="text-lg md:text-xl font-semibold">Mon profil</h1>
              <p className="text-sm text-muted-foreground">
                Connecté comme{' '}
                <span className="font-medium">
                  {profile.name || 'Utilisateur'}
                </span>{' '}
                · Rôle{' '}
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">
                  {profile.role}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Compte créé le {formatDate(profile.createdAt)} · Agence{' '}
                <span className="font-medium">{profile.agencyId}</span>
              </p>
            </div>
          </div>

          {/* Résumé validation + minutes */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-3 w-full md:w-auto">
            <div className="rounded-xl border bg-background px-3 py-2.5 text-xs md:text-sm">
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">
                Dernière semaine validée
              </div>
              <div className="font-semibold">
                {formatDate(profile.last_validated_week_start)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                Semaine de référence
              </div>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2.5 text-xs md:text-sm">
              <div className="text-[11px] uppercase text-muted-foreground tracking-wide">
                Validée le
              </div>
              <div className="font-semibold text-xs md:text-sm">
                {formatDateTime(profile.last_validated_at)}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
          {/* COLONNE GAUCHE : IDENTITÉ + VALIDATION */}
          <div className="space-y-6">
            {error && (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs md:text-sm text-emerald-700">
                {successMessage}
              </div>
            )}

            {/* Identité */}
            <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Identité</h2>
                <button
                  type="button"
                  onClick={openNameModal}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                >
                  Modifier le nom
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Nom affiché
                  </span>
                  <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                    {profile.name || 'Non renseigné'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Rôle
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.role}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Prestataire référent
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.agencyId}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Validation planning */}
            <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  Validation du planning
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Dernière semaine validée
                  </span>
                  <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                    {formatDate(profile.last_validated_week_start)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Date de validation
                  </span>
                  <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                    {formatDateTime(profile.last_validated_at)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Ces informations sont mises à jour automatiquement lorsque tu
                valides ta prochaine semaine via l&apos;interface prévue à cet
                effet.
              </p>
            </section>
          </div>

          {/* COLONNE DROITE : ADRESSE */}
          <div className="space-y-6">
            <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold">Adresse principale</h2>
                  <p className="text-xs text-muted-foreground">
                    Utilisée pour estimer les trajets et regrouper les
                    interventions par zones.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openAddressModal}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                  >
                    Modifier l&apos;adresse
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Label
                  </span>
                  <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                    {profile.address_label || 'Non renseigné'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-medium text-foreground">
                    Adresse formatée
                  </span>
                  <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground whitespace-pre-line">
                    {profile.formatted_address || 'Non renseignée'}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Rue
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.street || '—'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Numéro
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.street_number || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Code postal
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.postal_code || '—'}
                    </p>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <span className="text-xs font-medium text-foreground">
                      Ville
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.city || '—'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Pays
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.country || '—'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Code pays (ISO)
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.country_code || '—'}
                    </p>
                  </div>
                </div>

                {/* Coordonnées en lecture seule */}
                <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm">
                  <div className="space-y-1.5">
                    <span className="font-medium text-foreground">
                      Coordonnées (lat, lng)
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.lat != null && profile.lng != null
                        ? `${profile.lat.toFixed(6)}, ${profile.lng.toFixed(6)}`
                        : 'Non défini'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <span className="font-medium text-foreground">
                      Google Place ID
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground text-[11px] break-all">
                      {profile.google_place_id || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
            {/* Module carte Google Maps */}
            {profile.lat != null && profile.lng != null && (
              <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    Adresse sur la carte
                  </h2>
                  <span className="text-[11px] text-muted-foreground">
                    Vue centrée sur ton adresse principale
                  </span>
                </div>

                {!isMapsReady && (
                  <p className="text-xs text-muted-foreground">
                    Chargement de la carte Google Maps…
                  </p>
                )}

                <div className="mt-2 h-64 w-full rounded-md border overflow-hidden">
                  <div ref={mapContainerRef} className="h-full w-full" />
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Si la position ne correspond pas à ton domicile ou point de
                  départ réel, modifie l&apos;adresse via le bouton
                  &quot;Modifier l&apos;adresse&quot; ci-dessus.
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ───────────── MODALE MODIF NOM ───────────── */}
      {nameModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Modifier le nom</h2>
              <button
                type="button"
                onClick={closeNameModal}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fermer
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Le nom affiché est utilisé dans l&apos;interface et pour certaines
              notifications. Modifie-le uniquement si nécessaire.
            </p>

            <form onSubmit={handleSaveName} className="space-y-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="new_name"
                  className="text-xs font-medium text-foreground"
                >
                  Nouveau nom
                </label>
                <input
                  id="new_name"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  autoFocus
                />
              </div>

              {nameError && <p className="text-xs text-red-600">{nameError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeNameModal}
                  disabled={savingName}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingName}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingName ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────── MODALE MODIF ADRESSE (avec Google Maps Autocomplete) ───────────── */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Modifier l&apos;adresse principale
              </h2>
              <button
                type="button"
                onClick={closeAddressModal}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fermer
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              L&apos;adresse est utilisée pour calculer les trajets et regrouper
              les interventions. Choisis une adresse dans les suggestions Google
              pour garantir qu&apos;elle est correcte.
            </p>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="label_address"
                  className="text-xs font-medium text-foreground"
                >
                  Label
                </label>
                <input
                  id="label_address"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="Domicile, Bureau, Studio de musique…"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="autocomplete_address"
                  className="text-xs font-medium text-foreground"
                >
                  Adresse (via Google Maps)
                </label>
                <input
                  id="autocomplete_address"
                  ref={addressInputRef}
                  value={addressInput}
                  onChange={(e) => {
                    setAddressInput(e.target.value);
                    setSelectedAddress(null); // 👈 si l'utilisateur retape à la main, il doit revalider une suggestion
                  }}
                  placeholder="Commence à taper et choisis une suggestion"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />

                <p className="text-[11px] text-muted-foreground">
                  Tu dois sélectionner une suggestion dans la liste Google pour
                  pouvoir enregistrer.
                </p>
              </div>

              {/* Aperçu de l'adresse normalisée */}
              {selectedAddress && (
                <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                  <div>
                    <span className="font-semibold">Adresse normalisée : </span>
                    {selectedAddress.formattedAddress}
                  </div>
                  <div>
                    <span className="font-semibold">Rue : </span>
                    {selectedAddress.streetNumber} {selectedAddress.street}
                  </div>
                  <div>
                    <span className="font-semibold">Ville : </span>
                    {selectedAddress.postalCode} {selectedAddress.city} (
                    {selectedAddress.country})
                  </div>
                  <div>
                    <span className="font-semibold">Coordonnées : </span>
                    {selectedAddress.lat.toFixed(6)},{' '}
                    {selectedAddress.lng.toFixed(6)}
                  </div>
                </div>
              )}

              {addressError && (
                <p className="text-xs text-red-600">{addressError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeAddressModal}
                  disabled={savingAddress}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingAddress ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
