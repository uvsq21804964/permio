// components/address-autocomplete.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

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

type Props = {
  value: AddressDetails | null;
  onChange: (addr: AddressDetails | null, rawInput: string) => void;
  placeholder?: string;
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

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Commencez à taper et choisissez une suggestion Google',
}: Props) {
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [inputValue, setInputValue] = useState(value?.formattedAddress ?? '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isMapsReady) return;
    if (!window.google || !window.google.maps) return;
    if (!inputRef.current) return;

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

    const autocomplete = new places.Autocomplete(inputRef.current, options);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        onChange(null, inputRef.current?.value || '');
        return;
      }

      const comps = place.address_components;
      const currentInputValue = inputRef.current?.value || '';

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

      setInputValue(addr.formattedAddress);
      onChange(addr, addr.formattedAddress);
    });

    return () => {
      window.google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isMapsReady, onChange]);

  useEffect(() => {
    if (value?.formattedAddress && value.formattedAddress !== inputValue) {
      setInputValue(value.formattedAddress);
    }
  }, [value?.formattedAddress]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={() => setIsMapsReady(true)}
        onError={(e) => {
          console.error('Erreur de chargement du script Google Maps', e);
        }}
      />
      <input
        ref={inputRef}
        className="border rounded px-3 py-2 text-xs md:text-sm w-full"
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value;
          setInputValue(v);
          // si l'utilisateur modifie le texte, on invalide l'adresse sélectionnée
          if (!v.trim()) {
            onChange(null, v);
          }
        }}
      />
    </>
  );
}
