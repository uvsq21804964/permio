// components/associate-agency.tsx
'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganizationList } from '@clerk/nextjs';
import Script from 'next/script';

type Props = {
  onSuccess?: (data: {
    organizationId: string;
    agencyId?: string;
    agencyName?: string;
  }) => void;
  className?: string;
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

export default function AssociateAgency({ onSuccess, className }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adresse via Google
  const [isMapsReady, setIsMapsReady] = useState(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [addressInput, setAddressInput] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressDetails | null>(
    null
  );

  const { setActive } = useOrganizationList();
  const router = useRouter();

  // Initialisation de l'autocomplete Google sur le champ d'adresse
  useEffect(() => {
    if (!isMapsReady) return;
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
      // componentRestrictions: { country: 'fr' },
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

      const addr: AddressDetails = {
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

      // On synchronise l'input avec l'adresse choisie
      setAddressInput(addr.formattedAddress);
      setSelectedAddress(addr);
      setError(null);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isMapsReady]); // 👈 plus de addressInput ici

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      setError('Veuillez saisir un code agence.');
      return;
    }

    if (!selectedAddress) {
      setError(
        'Veuillez choisir une adresse dans les suggestions Google avant de continuer.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/agency/association', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: normalized,
          address: {
            formattedAddress: selectedAddress.formattedAddress,
            lat: selectedAddress.lat,
            lng: selectedAddress.lng,
            street: selectedAddress.street,
            streetNumber: selectedAddress.streetNumber,
            postalCode: selectedAddress.postalCode,
            city: selectedAddress.city,
            country: selectedAddress.country,
            countryCode: selectedAddress.countryCode,
            googlePlaceId: selectedAddress.googlePlaceId,
            rawInput: addressInput,
          },
        }),
      });

      const ct = res.headers.get('content-type') || '';
      let data: any = null;
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(
          text?.slice(0, 200) || `Réponse non JSON (status ${res.status})`
        );
      }

      if (!res.ok) {
        throw new Error(
          data?.error || `Association échouée (status ${res.status})`
        );
      }

      if (data.organizationId && setActive) {
        await setActive({ organization: data.organizationId });
      }

      // Callback éventuel du parent
      onSuccess?.(data);

      // Redirection vers l'accueil après succès
      router.push('/myweek');
    } catch (e: any) {
      setError(e?.details || e?.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    !loading &&
    code.trim().length > 0 &&
    !!selectedAddress &&
    !!addressInput.trim();

  return (
    <>
      {/* Script Google Maps pour ce composant */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => {
          console.error('Erreur de chargement du script Google Maps', e);
          setError(
            "Impossible de charger l'autocomplétion d'adresse Google. Vérifiez la clé API."
          );
        }}
      />

      <form
        onSubmit={onSubmit}
        className={[
          'flex flex-col gap-3 rounded-md border p-4 bg-white',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {/* Code agence */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="agency_code"
            className="text-sm font-medium text-gray-800"
          >
            Code agence
          </label>
          <div className="flex gap-2">
            <input
              id="agency_code"
              className="border rounded px-3 py-2 flex-1 text-sm"
              placeholder="Code agence"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              aria-label="Code agence"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <p className="text-xs text-gray-500">
            Ce code vous est fourni par votre organisation.
          </p>
        </div>

        {/* Adresse via Google */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="agency_address"
            className="text-sm font-medium text-gray-800"
          >
            Votre adresse de départ
          </label>
          <input
            id="agency_address"
            ref={addressInputRef}
            className="border rounded px-3 py-2 text-sm"
            placeholder="Commencez à taper et choisissez une suggestion Google"
            value={addressInput}
            onChange={(e) => {
              const value = e.target.value;
              setAddressInput(value);
              // On n'invalide la sélection que si le texte ne correspond plus à l'adresse choisie
              setSelectedAddress((current) => {
                if (!current) return null;
                if (current.formattedAddress === value) return current;
                return null;
              });
            }}
          />
          <p className="text-xs text-gray-500">
            Sélectionnez une adresse proposée par Google pour garantir
            qu&apos;elle soit géolocalisable (trajets, distances...).
          </p>

          {selectedAddress && (
            <div className="mt-2 rounded bg-gray-50 border text-xs p-2 space-y-1">
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
        </div>

        {/* Erreur globale */}
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-4 py-2 rounded bg-black text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Association…' : 'Associer et continuer'}
          </button>
        </div>
      </form>
    </>
  );
}
