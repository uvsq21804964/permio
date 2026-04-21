'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { AddressDetails } from '@/lib/client/utils/address';
import { mapGooglePlaceToAddress } from '@/lib/client/utils/address';
import { clearGoogleMapsInstanceListeners } from '@/lib/client/utils/google-maps';

type Options = {
  enabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  fallbackFormattedAddress?: string;
  onSelect: (address: AddressDetails) => void;
  onInvalidSelection: () => void;
};

export function useGooglePlacesAutocomplete({
  enabled,
  inputRef,
  fallbackFormattedAddress,
  onSelect,
  onInvalidSelection,
}: Options) {
  const onSelectRef = useRef(onSelect);
  const onInvalidSelectionRef = useRef(onInvalidSelection);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onInvalidSelectionRef.current = onInvalidSelection;
  }, [onInvalidSelection]);

  useEffect(() => {
    if (!enabled) return;
    if (!inputRef.current) return;

    const AutocompleteCtor = window.google?.maps?.places?.Autocomplete;
    if (!AutocompleteCtor) return;

    const autocomplete = new AutocompleteCtor(inputRef.current, {
      types: ['address'],
      fields: [
        'formatted_address',
        'geometry',
        'address_components',
        'place_id',
      ],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const fallback = inputRef.current?.value ?? fallbackFormattedAddress ?? '';
      const address = mapGooglePlaceToAddress(place, fallback);

      if (!address) {
        onInvalidSelectionRef.current();
        return;
      }

      onSelectRef.current(address);
    });

    return () => {
      window.google?.maps?.event?.removeListener?.(listener);
      clearGoogleMapsInstanceListeners(autocomplete);
    };
  }, [enabled, fallbackFormattedAddress, inputRef]);
}
