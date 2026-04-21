'use client';

import Script from 'next/script';
import { getGoogleMapsPlacesScriptSrc } from '@/lib/client/utils/google-maps';

type Props = {
  onReady: () => void;
  onLoadError: (event: unknown) => void;
};

export default function GooglePlacesScript({ onReady, onLoadError }: Props) {
  return (
    <Script
      src={getGoogleMapsPlacesScriptSrc()}
      strategy="afterInteractive"
      onLoad={onReady}
      onError={onLoadError}
    />
  );
}
