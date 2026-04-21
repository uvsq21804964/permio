'use client';

import { useEffect, useRef, type RefObject } from 'react';
import type { AddressDetails } from '@/lib/client/utils/address';

type Options = {
  enabled: boolean;
  mapRef: RefObject<HTMLDivElement | null>;
  address: AddressDetails | null;
};

export function useGoogleMapPreview({ enabled, mapRef, address }: Options) {
  const mapInstanceRef = useRef<any | null>(null);
  const markerRef = useRef<any | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (!address) return;
    if (!mapRef.current) return;
    if (!window.google?.maps) return;

    const coords = { lat: address.lat, lng: address.lng };

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

      return;
    }

    mapInstanceRef.current.setCenter(coords);
    if (markerRef.current) {
      markerRef.current.setPosition(coords);
      return;
    }

    markerRef.current = new window.google.maps.Marker({
      position: coords,
      map: mapInstanceRef.current,
    });
  }, [address, enabled, mapRef]);
}
