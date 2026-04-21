import type { Travel } from '@/types/availability';

export function formatServicePrice(
  price: number | string | null | undefined
): string | null {
  if (price === null || price === undefined) {
    return null;
  }

  const numericValue = typeof price === 'string' ? Number(price) : price;
  if (!Number.isFinite(numericValue)) {
    return String(price);
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return numericValue.toFixed(2);
  }
}

export function buildGoogleMapsUrl(travel: Travel): string | null {
  const origin =
    travel.dogsitter_lat != null && travel.dogsitter_lng != null
      ? `${travel.dogsitter_lat},${travel.dogsitter_lng}`
      : travel.dogsitter_formatted_address;

  const destination =
    travel.client_lat != null && travel.client_lng != null
      ? `${travel.client_lat},${travel.client_lng}`
      : travel.client_formatted_address;

  if (!origin && !destination) {
    return null;
  }

  const params: string[] = ['api=1'];
  if (origin) {
    params.push(`origin=${encodeURIComponent(origin)}`);
  }
  if (destination) {
    params.push(`destination=${encodeURIComponent(destination)}`);
  }

  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}
