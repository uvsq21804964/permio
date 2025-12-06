'use client';

import { useEffect, useRef, useState, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Script from 'next/script';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

type AddressMode = 'saved' | 'custom';

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

function encodeAddress(addr: BookingAddress): string {
  const json = JSON.stringify(addr);
  return encodeURIComponent(json);
}

export default function BookAddressPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get('serviceId');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addressMode, setAddressMode] = useState<AddressMode>('saved');
  const [savedAddress, setSavedAddress] = useState<BookingAddress | null>(null);
  const [savedAddressLoading, setSavedAddressLoading] = useState(true);

  // Autocomplete Google
  const [isMapsReady, setIsMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<BookingAddress | null>(
    null
  );

  // Carte Google (uniquement pour l'adresse ponctuelle)
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  // Si le script Google Maps est déjà chargé (retour arrière, navigation client...),
  // on marque directement isMapsReady à true.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google && window.google.maps && !isMapsReady) {
      setIsMapsReady(true);
    }
  }, [isMapsReady]);

  // 1) Protéger si pas de serviceId
  useEffect(() => {
    if (!serviceId) {
      setError(
        'Aucun service sélectionné. Veuillez revenir à la page précédente.'
      );
    }
  }, [serviceId]);

  // 2) Charger l’adresse enregistrée du user (via ton API profil / me)
  useEffect(() => {
    const fetchProfile = async () => {
      setSavedAddressLoading(true);
      try {
        const res = await fetch('/api/me/profile', { credentials: 'include' });
        if (!res.ok) return;

        const data = await res.json();
        const u = data?.user;
        if (!u) return;

        if (u.formatted_address && u.lat != null && u.lng != null) {
          setSavedAddress({
            formattedAddress: u.formatted_address,
            lat: u.lat,
            lng: u.lng,
            street: u.street ?? '',
            streetNumber: u.street_number ?? '',
            postalCode: u.postal_code ?? '',
            city: u.city ?? '',
            country: u.country ?? '',
            countryCode: u.country_code ?? '',
            googlePlaceId: u.google_place_id ?? undefined,
          });
        }
      } catch (e) {
        console.error('Erreur chargement profil pour adresse', e);
      } finally {
        setSavedAddressLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // 3) Initialiser l'autocomplete Google (seulement en mode "custom")
  useEffect(() => {
    // Google pas prêt → stop
    if (!isMapsReady) return;

    // On ne monte l'autocomplete que si on est en mode "adresse ponctuelle"
    if (addressMode !== 'custom') return;

    if (!window.google || !window.google.maps) return;
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
    };

    const autocomplete = new places.Autocomplete(
      addressInputRef.current,
      options
    );

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        setError(
          'Impossible de récupérer la géolocalisation de cette adresse.'
        );
        setSelectedAddress(null);
        return;
      }

      const comps = place.address_components;
      const currentInputValue = addressInputRef.current?.value || '';

      const addr: BookingAddress = {
        formattedAddress: place.formatted_address ?? currentInputValue,
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
      setError(null);
    });

    // cleanup quand le composant change / se démonte
    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isMapsReady, addressMode]);

  // 4) Initialisation / mise à jour de la carte (uniquement pour adresse ponctuelle)
  useEffect(() => {
    if (!isMapsReady) return;
    if (addressMode !== 'custom') return;
    if (!window.google || !window.google.maps) return;
    if (!mapRef.current) return;

    // Pour la carte, on ne prend QUE l'adresse ponctuelle sélectionnée
    if (!selectedAddress) return;

    const coords = { lat: selectedAddress.lat, lng: selectedAddress.lng };

    if (!mapInstanceRef.current) {
      // Création de la carte
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
      // Mise à jour de la position
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
  }, [isMapsReady, addressMode, selectedAddress]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!serviceId) return;

    setError(null);

    let addr: BookingAddress | null = null;

    if (addressMode === 'saved') {
      if (!savedAddress) {
        setError(
          "Vous n'avez pas d'adresse enregistrée. Choisissez une adresse ponctuelle."
        );
        return;
      }
      addr = savedAddress;
    } else {
      if (!selectedAddress) {
        setError(
          'Veuillez choisir une adresse dans les suggestions Google pour ce rendez-vous.'
        );
        return;
      }
      addr = selectedAddress;
    }

    const encoded = encodeAddress(addr);
    router.push(`/book/proposals?serviceId=${serviceId}&addr=${encoded}`);
  };

  const canSubmit =
    !!serviceId &&
    !loading &&
    ((addressMode === 'saved' && !!savedAddress) ||
      (addressMode === 'custom' && !!selectedAddress));

  const hasCoords = addressMode === 'custom' && !!selectedAddress;

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Script Google pour l’autocomplete + carte */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => {
          console.error('Erreur chargement Google Maps', e);
          setError(
            "Impossible de charger l'autocomplétion Google. Vérifiez votre connexion."
          );
        }}
      />

      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg">
              Où aura lieu ce rendez-vous ?
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Votre adresse nous permet de calculer les temps de trajet de votre
              moniteur avant d&apos;afficher les créneaux disponibles.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-xs md:text-sm">
                {/* Adresse enregistrée */}
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      value="saved"
                      checked={addressMode === 'saved'}
                      onChange={() => setAddressMode('saved')}
                      disabled={savedAddressLoading || !savedAddress}
                    />
                    <span>
                      Utiliser mon adresse enregistrée
                      {savedAddressLoading && (
                        <span className="ml-1 text-[11px] text-muted-foreground">
                          (chargement…)
                        </span>
                      )}
                      {!savedAddressLoading && !savedAddress && (
                        <span className="ml-1 text-[11px] text-red-500">
                          (aucune adresse enregistrée)
                        </span>
                      )}
                    </span>
                  </label>

                  {savedAddress && addressMode === 'saved' && (
                    <div className="ml-5 rounded border bg-muted/50 p-2 text-[11px] space-y-1">
                      <div className="font-semibold">Adresse enregistrée :</div>
                      <div>{savedAddress.formattedAddress}</div>
                      <div>
                        {savedAddress.postalCode} {savedAddress.city} (
                        {savedAddress.country})
                      </div>
                    </div>
                  )}
                </div>

                {/* Adresse ponctuelle */}
                <div className="space-y-1">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="radio"
                      className="h-3 w-3"
                      value="custom"
                      checked={addressMode === 'custom'}
                      onChange={() => setAddressMode('custom')}
                    />
                    <span>Utiliser une autre adresse pour ce rendez-vous</span>
                  </label>

                  {addressMode === 'custom' && (
                    <div className="ml-5 space-y-1">
                      <input
                        ref={addressInputRef}
                        className="border rounded px-3 py-2 text-xs md:text-sm w-full"
                        placeholder="Commencez à taper et choisissez une suggestion Google"
                        value={addressInput}
                        onChange={(e) => {
                          const v = e.target.value;
                          setAddressInput(v);
                          // si le texte ne correspond plus à l’adresse choisie, on invalide
                          setSelectedAddress((current) => {
                            if (!current) return null;
                            if (current.formattedAddress === v) return current;
                            return null;
                          });
                        }}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Sélectionnez une adresse proposée par Google pour
                        garantir qu&apos;elle soit géolocalisable.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Carte uniquement pour l'adresse ponctuelle */}
              {addressMode === 'custom' && (
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
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription className="text-xs md:text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={!canSubmit}>
                  Continuer vers les créneaux
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
