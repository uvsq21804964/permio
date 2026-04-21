'use client';

import { useRef } from 'react';
import type { AddressDetails } from '@/lib/client/utils/address';
import { useGoogleMapPreview } from '@/lib/client/hooks/useGoogleMapPreview';

type Props = {
  address: AddressDetails | null;
  isMapsReady: boolean;
  loadingText: string;
  emptyText: string;
  heightClassName?: string;
};

export default function AddressMapPreview({
  address,
  isMapsReady,
  loadingText,
  emptyText,
  heightClassName = 'h-52',
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const hasCoords = Boolean(address);

  useGoogleMapPreview({
    enabled: isMapsReady && hasCoords,
    mapRef,
    address,
  });

  return (
    <div className={`border rounded-md bg-muted/40 overflow-hidden relative ${heightClassName}`}>
      {(!isMapsReady || !hasCoords) && (
        <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] text-muted-foreground">
          {!isMapsReady ? loadingText : emptyText}
        </div>
      )}
      <div
        ref={mapRef}
        className={`h-full w-full ${!isMapsReady || !hasCoords ? 'hidden' : 'block'}`}
      />
    </div>
  );
}
