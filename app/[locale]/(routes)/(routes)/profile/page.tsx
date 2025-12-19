// app/[locale]/profile/page.tsx
'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import Script from 'next/script';
import { useLocale, useTranslations } from 'next-intl';

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

  // ✅ Ajout: code éducateur (join code agence)
  // ⚠️ nécessite que /api/me/profile renvoie joinCode (sinon affichera "—")
  joinCode?: string | null;

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

function formatDate(value: string | null, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(value)
  );
}

function formatDateTime(value: string | null, locale: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatMinutesToHours(min: number | null | undefined, locale: string) {
  if (min == null) return '—';
  const m = Math.max(0, min);
  const h = Math.floor(m / 60);
  const rest = m % 60;

  // Simple i18n-friendly formatting (can be improved via messages if you want)
  const isFR = locale.startsWith('fr');
  const minLabel = isFR ? 'min' : 'min';
  const hourLabel = isFR ? 'h' : 'h';

  if (h === 0) return `${rest} ${minLabel}`;
  if (rest === 0) return `${h} ${hourLabel}`;
  return `${h} ${hourLabel} ${rest} ${minLabel}`;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [nameModalOpen, setNameModalOpen] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Drafts
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

  // Copy educator code
  const [copied, setCopied] = useState(false);
  const copyJoinCode = async () => {
    const code = profile?.joinCode || '';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      alert(code);
    }
  };

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
        throw new Error(data.error || t('errors.loadProfile'));
      }
      const data = await res.json();
      setProfile(data.user);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || t('errors.loadProfile'));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autocomplete Google sur "Adresse formatée"
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
        setAddressError(t('errors.geocodeFail'));
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
  }, [addressModalOpen, isMapsReady, draftAddress.formatted_address, t]);

  // Init / update carte
  useEffect(() => {
    if (!isMapsReady) return;
    if (!window.google || !window.google.maps) return;
    if (!mapRef.current) return;
    if (!profile) return;

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

  // Suppression compte
  const handleDeleteAccount = async () => {
    if (!window.confirm(t('delete.confirmPrompt'))) return;

    try {
      setDeleting(true);
      setDeleteError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/me/delete-account', { method: 'DELETE' });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t('errors.deleteFailed'));
      }

      // Redirection après suppression (avec locale)
      window.location.href = `/${locale}/home`;
    } catch (err: any) {
      console.error(err);
      setDeleteError(err?.message || t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  // UI states
  if (loading) {
    return (
      <>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
          onLoad={() => setIsMapsReady(true)}
          onError={(e) => {
            console.error('Google Maps script load error', e);
            setAddressError(t('errors.mapsLoad'));
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
            console.error('Google Maps script load error', e);
            setAddressError(t('errors.mapsLoad'));
          }}
        />
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
            <p className="text-sm text-red-600">{t('errors.loadProfile')}</p>
            <button
              onClick={loadProfile}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t('common.retry')}
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

  // Handlers modale nom
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

    if (!draftName.trim()) {
      setNameError(t('errors.nameEmpty'));
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
        throw new Error(data.error || t('errors.updateNameFailed'));
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccessMessage(t('success.nameUpdated'));
      setNameModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setNameError(err?.message || t('errors.updateNameFailed'));
    } finally {
      setSavingName(false);
    }
  };

  // Handlers modale adresse
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
      setSelectedAddress((current) => {
        if (!current) return null;
        if (current.formattedAddress === value) return current;
        return null;
      });
    }
  };

  const handleSaveAddress = async (e: FormEvent) => {
    e.preventDefault();

    if (!draftAddress.formatted_address.trim()) {
      setAddressError(t('errors.addressEmpty'));
      return;
    }

    if (!selectedAddress) {
      setAddressError(t('errors.addressNeedSuggestion'));
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
        throw new Error(data.error || t('errors.updateAddressFailed'));
      }

      const data = await res.json();
      setProfile(data.user);
      setSuccessMessage(t('success.addressUpdated'));
      setAddressModalOpen(false);
      setSelectedAddress(null);
    } catch (err: any) {
      console.error(err);
      setAddressError(err?.message || t('errors.updateAddressFailed'));
    } finally {
      setSavingAddress(false);
    }
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => {
          console.error('Google Maps script load error', e);
          setAddressError(t('errors.mapsLoad'));
        }}
      />

      <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl space-y-6">
          {/* HEADER */}
          <section className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </div>
              <div className="space-y-1">
                <h1 className="text-lg md:text-xl font-semibold">
                  {t('header.title')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {t('header.connectedAs')}{' '}
                  <span className="font-medium">
                    {profile.name || t('common.user')}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('header.createdOn', {
                    date: formatDate(profile.createdAt, locale),
                  })}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
            {/* COLONNE GAUCHE */}
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
                  <h2 className="text-sm font-semibold">
                    {t('identity.title')}
                  </h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {t('identity.displayName.label')}
                    </span>

                    <div className="flex items-center gap-2">
                      <p className="flex-1 border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground font-mono">
                        {profile.name || t('identity.displayName.empty')}
                      </p>
                      <button
                        type="button"
                        onClick={openNameModal}
                        className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-[11px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {t('identity.displayName.edit')}
                      </button>
                    </div>
                  </div>

                  {/* ✅ Code éducateur (non modifiable) */}
                  {profile.role === 'instructor' && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('identity.educatorCode.label')}
                      </span>

                      <div className="flex items-center gap-2">
                        <p className="flex-1 border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground font-mono">
                          {profile.joinCode || '—'}
                        </p>

                        <button
                          type="button"
                          onClick={copyJoinCode}
                          disabled={!profile.joinCode}
                          className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-[11px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                          title={t('identity.educatorCode.copyTitle')}
                        >
                          {copied
                            ? t('identity.educatorCode.copied')
                            : t('identity.educatorCode.copy')}
                        </button>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {t('identity.educatorCode.help')}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('identity.role')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.role}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('identity.agency')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.agencyId}
                      </p>
                    </div>
                  </div>

                  {/* (optionnel) si tu veux afficher planned/remaining avec i18n : */}
                  {/* <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        Planned
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {formatMinutesToHours(profile.planned_minutes, locale)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        Remaining
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {formatMinutesToHours(profile.remaining_minutes, locale)}
                      </p>
                    </div>
                  </div> */}
                </div>
              </section>

              {/* Suppression */}
              <section className="rounded-2xl border p-4 md:p-5 space-y-3">
                <h2 className="text-sm font-semibold">{t('delete.title')}</h2>
                <p className="text-xs">{t('delete.body')}</p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? t('delete.inProgress') : t('delete.button')}
                </button>
              </section>
            </div>

            {/* COLONNE DROITE */}
            <div className="space-y-6">
              <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-semibold">
                      {t('address.title')}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {t('address.subtitle')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openAddressModal}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
                    >
                      {t('address.edit')}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {t('address.label')}
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                      {profile.address_label || '—'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {t('address.formatted')}
                    </span>
                    <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground whitespace-pre-line">
                      {profile.formatted_address || '—'}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.street')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.street || '—'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.number')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.street_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.postalCode')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.postal_code || '—'}
                      </p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.city')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.city || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.country')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.country || '—'}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-foreground">
                        {t('address.countryCode')}
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
                        {t('address.coords.label')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {profile.lat != null && profile.lng != null
                          ? `${profile.lat.toFixed(6)}, ${profile.lng.toFixed(
                              6
                            )}`
                          : t('address.coords.empty')}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-medium text-foreground">
                        {t('address.placeId.label')}
                      </span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground text-[11px] break-all">
                        {profile.google_place_id || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Carte */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-foreground">
                      {t('address.map.label')}
                    </span>
                    <div className="border rounded-md bg-muted/40 h-52 overflow-hidden relative">
                      {(!isMapsReady || !hasCoords) && (
                        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
                          {!isMapsReady
                            ? t('address.map.loading')
                            : t('address.map.noCoords')}
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

                  {/* (optionnel) dates debug */}
                  {/* <div className="grid gap-3 md:grid-cols-2 text-xs md:text-sm">
                    <div className="space-y-1.5">
                      <span className="font-medium text-foreground">Updated</span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {formatDateTime(profile.updatedAt, locale)}
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <span className="font-medium text-foreground">Last validated</span>
                      <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                        {formatDateTime(profile.last_validated_at, locale)}
                      </p>
                    </div>
                  </div> */}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* MODALE NOM */}
        {nameModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-card border shadow-lg p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {t('modals.name.title')}
                </h2>
                <button
                  type="button"
                  onClick={closeNameModal}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.close')}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('modals.name.helper')}
              </p>

              <form onSubmit={handleSaveName} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="new_name"
                    className="text-xs font-medium text-foreground"
                  >
                    {t('modals.name.newName')}
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
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingName}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingName ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODALE ADRESSE */}
        {addressModalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">
                  {t('modals.address.title')}
                </h2>
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {t('common.close')}
                </button>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('modals.address.helper')}
              </p>

              <form onSubmit={handleSaveAddress} className="space-y-3 text-sm">
                <div className="space-y-1.5">
                  <label
                    htmlFor="address_label"
                    className="text-xs font-medium text-foreground"
                  >
                    {t('address.label')}
                  </label>
                  <input
                    id="address_label"
                    name="address_label"
                    value={draftAddress.address_label}
                    onChange={handleAddressDraftChange}
                    placeholder={t('modals.address.labelPlaceholder')}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="formatted_address"
                    className="text-xs font-medium text-foreground"
                  >
                    {t('address.formatted')}
                  </label>
                  <input
                    id="formatted_address"
                    name="formatted_address"
                    ref={formattedAddressRef}
                    value={draftAddress.formatted_address}
                    onChange={handleAddressDraftChange}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder={t('modals.address.formattedPlaceholder')}
                  />
                </div>

                {selectedAddress && (
                  <div className="mt-1 rounded bg-gray-50 border text-xs p-2 space-y-1">
                    <div className="font-semibold">
                      {t('modals.address.selectedTitle')}
                    </div>
                    <div>{selectedAddress.formattedAddress}</div>
                    <div>
                      <span className="font-medium">
                        {t('modals.address.selectedStreet')}{' '}
                      </span>
                      {selectedAddress.streetNumber} {selectedAddress.street}
                    </div>
                    <div>
                      <span className="font-medium">
                        {t('modals.address.selectedCity')}{' '}
                      </span>
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
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingAddress ? t('common.saving') : t('common.save')}
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
