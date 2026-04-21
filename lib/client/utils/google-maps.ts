declare global {
  interface Window {
    google: any;
  }
}

export const GOOGLE_MAPS_PLACES_LIBRARIES = 'places';

export function getGoogleMapsPlacesScriptSrc() {
  return `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=${GOOGLE_MAPS_PLACES_LIBRARIES}`;
}

export function isGoogleMapsPlacesReady() {
  if (typeof window === 'undefined') {
    return false;
  }

  return Boolean(window.google?.maps?.places?.Autocomplete);
}

export function clearGoogleMapsInstanceListeners(instance: unknown) {
  if (!instance || typeof window === 'undefined') {
    return;
  }

  window.google?.maps?.event?.clearInstanceListeners?.(instance);
}
