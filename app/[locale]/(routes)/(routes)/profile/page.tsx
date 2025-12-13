'use client';

import { useEffect, useState, FormEvent, ChangeEvent, useRef } from 'react';
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Drafts pour les modales
  const [draftName, setDraftName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [draftAddress, setDraftAddress] = useState({
    address_label: '',
    formatted_address: '',
    street: '',
    street_number: '',
    postal_code: '',
    city: '',
    country: '',
    country_code: '',
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Suppression de compte
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Google Maps / Autocomplete
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null
  );
  const [isMapsReady, setIsMapsReady] = useState(false);
  const formattedAddressRef = useRef<HTMLInputElement | null>(null);

  // Google Maps / carte
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

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

  // Initialisation de l'autocomplete Google sur "Adresse formatée"
  useEffect(() => {
    if (!addressModalOpen) return;
    if (!isMapsReady) return;
    if (!window.google || !window.google.maps || !window.google.maps.places)
      return;

    const el = formattedAddressRef.current;
    if (!el) return;

    const autocomplete = new window.google.maps.places.Autocomplete(el, {
      types: ['address'],
      fields: [
        'formatted_address',
        'geometry',
        'address_components',
        'place_id',
      ],
      // componentRestrictions: { country: 'fr' },
    });

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
        formattedAddress:
          place.formatted_address ?? draftAddress.formatted_address,
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

      setDraftAddress((prev) => ({
        ...prev,
        formatted_address: addr.formattedAddress,
        street: addr.street,
        street_number: addr.streetNumber,
        postal_code: addr.postalCode,
        city: addr.city,
        country: addr.country,
        country_code: addr.countryCode,
      }));

      setSelectedAddress(addr);
      setAddressError(null);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [addressModalOpen, isMapsReady, draftAddress.formatted_address]);

  // Initialisation / mise à jour de la carte
  useEffect(() => {
    if (!isMapsReady) return;
    if (!window.google || !window.google.maps) return;
    if (!mapRef.current) return;
    if (!profile) return;

    // On privilégie l'adresse sélectionnée dans la modale si elle existe,
    // sinon on utilise les coordonnées enregistrées dans le profil
    const coords = selectedAddress
      ? { lat: selectedAddress.lat, lng: selectedAddress.lng }
      : profile.lat != null && profile.lng != null
      ? { lat: profile.lat, lng: profile.lng }
      : null;

    if (!coords) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: coords,
        zoom: 14,
        disableDefaultUI: true,
      });

      markerRef.current = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
      });
    } else {
      mapInstanceRef.current.setCenter(coords);
      if (markerRef.current) {
        markerRef.current.setPosition(coords);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: coords,
          map: mapInstanceRef.current,
        });
      }
    }
  }, [isMapsReady, profile, selectedAddress]);

  // ─────────────────────────  HANDLER SUPPRESSION COMPTE  ─────────────────────────

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Es-tu sûr de vouloir supprimer définitivement ton compte ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/me/delete-account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || 'Impossible de supprimer le compte utilisateur.'
        );
      }

      // Redirection après suppression
      window.location.href = '/home';
    } catch (err: any) {
      console.error(err);
      setDeleteError(
        err?.message || 'Erreur lors de la suppression du compte.'
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────  UI STATES  ─────────────────────────

  if (loading) {
    return (
      <>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setIsMapsReady(true)}
          onError={(e) => {
            console.error('Erreur de chargement du script Google Maps', e);
            setAddressError(
              "Impossible de charger l'autocomplétion d'adresse Google. Vérifiez la clé API."
            );
          }}
        />
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
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setIsMapsReady(true)}
          onError={(e) => {
            console.error('Erreur de chargement du script Google Maps', e);
            setAddressError(
              "Impossible de charger l'autocomplétion d'adresse Google. Vérifiez la clé API."
            );
          }}
        />
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
      </>
    );
  }

  const initials =
    profile.name
      ?.trim()
      ?.split(' ')
      ?.map((p) => p[0])
      ?.join('')
      ?.toUpperCase() || profile.id.slice(0, 2).toUpperCase();

  const hasCoords =
    (profile.lat != null && profile.lng != null) || selectedAddress != null;

  // ─────────────────────────  HANDLERS MODALE NOM  ─────────────────────────

  const openNameModal = () => {
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

  // ─────────────────────────  HANDLERS MODALE ADRESSE  ─────────────────────────

  const openAddressModal = () => {
    setDraftAddress({
      address_label: profile.address_label || '',
      formatted_address: profile.formatted_address || '',
      street: profile.street || '',
      street_number: profile.street_number || '',
      postal_code: profile.postal_code || '',
      city: profile.city || '',
      country: profile.country || '',
      country_code: profile.country_code || '',
    });
    setAddressError(null);
    setSuccessMessage(null);

    if (
      profile.formatted_address &&
      profile.lat != null &&
      profile.lng != null
    ) {
      setSelectedAddress({
        formattedAddress: profile.formatted_address,
        lat: profile.lat,
        lng: profile.lng,
        street: profile.street || '',
        streetNumber: profile.street_number || '',
        postalCode: profile.postal_code || '',
        city: profile.city || '',
        country: profile.country || '',
        countryCode: profile.country_code || '',
        googlePlaceId: profile.google_place_id || undefined,
      });
    } else {
      setSelectedAddress(null);
    }

    setAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    if (savingAddress) return;
    setAddressModalOpen(false);
  };

  const handleAddressDraftChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setDraftAddress((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'formatted_address') {
      // On n'invalide la sélection que si l'utilisateur change vraiment le texte
      setSelectedAddress((current) => {
        if (!current) return null;

        // Si la valeur correspond à l'adresse sélectionnée, on garde la sélection
        if (current.formattedAddress === value) {
          return current;
        }

        // Sinon, l'utilisateur a modifié le texte => on invalide
        return null;
      });
    }
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!draftAddress.formatted_address.trim()) {
      setAddressError("L'adresse formatée ne peut pas être vide.");
      return;
    }

    if (!selectedAddress) {
      setAddressError(
        "Veuillez choisir une adresse dans les suggestions Google avant d'enregistrer."
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
          name: profile.name,
          planned_minutes: profile.planned_minutes,
          address_label: draftAddress.address_label || null,
          formatted_address: draftAddress.formatted_address.trim(),
          street: draftAddress.street || null,
          street_number: draftAddress.street_number || null,
          postal_code: draftAddress.postal_code || null,
          city: draftAddress.city || null,
          country: draftAddress.country || null,
          country_code: draftAddress.country_code || null,
          lat: selectedAddress.lat,
          lng: selectedAddress.lng,
          google_place_id: selectedAddress.googlePlaceId ?? null,
          raw_input: draftAddress.formatted_address.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update address');
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccessMessage('Adresse mise à jour avec succès.');
      setAddressModalOpen(false);
      setSelectedAddress(null);
    } catch (err: any) {
      console.error(err);
      setAddressError(
        err?.message || 'Erreur lors de la mise à jour de l’adresse.'
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // ─────────────────────────  RENDER  ─────────────────────────

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => {
          console.error('Erreur de chargement du script Google Maps', e);
          setAddressError(
            "Impossible de charger l'autocomplétion d'adresse Google. Vérifiez la clé API."
          );
        }}
      />

      <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
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
                </p>
                <p className="text-xs text-muted-foreground">
                  Compte créé le {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
            {/* COLONNE GAUCHE : IDENTITÉ + VALIDATION + SUPPRESSION */}
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
              {deleteError && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
                  {deleteError}
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
                        Agence
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.agencyId}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Suppression du compte */}
              <section className="rounded-2xl border p-4 md:p-5 space-y-3">
                <h2 className="text-sm font-semibold">Supprimer mon compte</h2>
                <p className="text-xs">
                  Cette action est définitive : ton profil sera supprimé de la
                  base de données et de notre système d&apos;authentification.
                  Tu devras créer un nouveau compte si tu souhaites revenir plus
                  tard.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting
                    ? 'Suppression en cours…'
                    : 'Supprimer mon compte définitivement'}
                </button>
              </section>
            </div>

            {/* COLONNE DROITE : ADRESSE */}
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">
                      Adresse principale
                    </h2>
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

                  {/* Coordonnées */}
                  <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm">
                    <div className="space-y-1.5">
                      <span className="font-medium text-foreground">
                        Coordonnées (lat, lng)
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.lat != null && profile.lng != null
                          ? `${profile.lat.toFixed(6)}, ${profile.lng.toFixed(
                              6
                            )}`
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

                  {/* Carte */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      Carte
                    </span>
                    <div className="border rounded-md bg-muted/40 h-52 overflow-hidden relative">
                      {(!isMapsReady || !hasCoords) && (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                          {!isMapsReady
                            ? 'Chargement de la carte…'
                            : 'Aucune adresse géolocalisée pour l’instant.'}
                        </div>
                      )}
                      <div
                        ref={mapRef}
                        className={`h-full w-full ${
                          !isMapsReady || !hasCoords ? 'hidden' : 'block'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* MODALE MODIF NOM */}
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
                Le nom affiché est utilisé dans l&apos;interface et pour
                certaines notifications. Modifie-le uniquement si nécessaire.
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

                {nameError && (
                  <p className="text-xs text-red-600">{nameError}</p>
                )}

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

        {/* MODALE MODIF ADRESSE (UNIQUEMENT LABEL + ADRESSE FORMATÉE) */}
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
                L&apos;adresse est utilisée pour calculer les trajets et
                regrouper les interventions. Choisis une suggestion Google pour
                garantir une adresse géolocalisable.
              </p>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <label
                    htmlFor="address_label"
                    className="text-xs font-medium text-foreground"
                  >
                    Label
                  </label>
                  <input
                    id="address_label"
                    name="address_label"
                    value={draftAddress.address_label}
                    onChange={handleAddressDraftChange}
                    placeholder="Domicile, Bureau, Studio de musique…"
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="formatted_address"
                    className="text-xs font-medium text-foreground"
                  >
                    Adresse formatée
                  </label>
                  <input
                    id="formatted_address"
                    name="formatted_address"
                    ref={formattedAddressRef}
                    value={draftAddress.formatted_address}
                    onChange={handleAddressDraftChange}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Commence à taper et choisis une suggestion Google"
                  />
                </div>

                {selectedAddress && (
                  <div className="mt-1 rounded bg-gray-50 border text-xs p-2 space-y-1">
                    <div className="font-semibold">Adresse sélectionnée :</div>
                    <div>{selectedAddress.formattedAddress}</div>
                    <div>
                      <span className="font-medium">Rue : </span>
                      {selectedAddress.streetNumber} {selectedAddress.street}
                    </div>
                    <div>
                      <span className="font-medium">Ville : </span>
                      {selectedAddress.postalCode} {selectedAddress.city} (
                      {selectedAddress.country})
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
    </>
  );
}
