import { devLogger } from '@/lib/shared/dev-logger';

export type TravelPoint = {
  lat: number | null;
  lng: number | null;
  formatted_address: string | null;
};

export type TravelMetrics = {
  minutes: number;
  km: number;
};

export type TravelDurationCache = Map<string, TravelMetrics | null>;

function roundUpTo5(minutes: number): number {
  if (minutes <= 0) return 0;
  return Math.ceil(minutes / 5) * 5;
}

function buildLatLngString(point: TravelPoint): string | null {
  if (point.lat == null || point.lng == null) return null;
  return `${point.lat},${point.lng}`;
}

function pointKey(point: TravelPoint): string {
  if (point.lat != null && point.lng != null) return `${point.lat},${point.lng}`;
  if (point.formatted_address) return point.formatted_address;
  return 'unknown';
}

export function createTravelDurationCache(): TravelDurationCache {
  return new Map<string, TravelMetrics | null>();
}

function roundKm(meters: number) {
  if (meters <= 0) return 0;
  return Math.round((meters / 1000) * 10) / 10;
}

export async function getTravelMetricsWithCache(
  origin: TravelPoint,
  destination: TravelPoint,
  cache: TravelDurationCache,
): Promise<TravelMetrics | null> {
  const apiKey =
    process.env.GOOGLE_MAPS_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const originParam = buildLatLngString(origin) ?? origin.formatted_address;
  const destinationParam =
    buildLatLngString(destination) ?? destination.formatted_address;

  if (!apiKey || !originParam || !destinationParam) {
    devLogger.log('[DISTANCE] missing parameters', {
      apiKeyPresent: !!apiKey,
      originParam,
      destinationParam,
    });
    return null;
  }

  const cacheKey = `${pointKey(origin)}|${pointKey(destination)}`;
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey) ?? null;
    devLogger.log('[DISTANCE] cache hit', { key: cacheKey, metrics: cached });
    return cached;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('units', 'metric');
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('origins', originParam);
  url.searchParams.set('destinations', destinationParam);

  try {
    devLogger.log('[DISTANCE] call', {
      origin: originParam,
      destination: destinationParam,
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      devLogger.error('[DISTANCE] HTTP error', response.status, text.slice(0, 300));
      cache.set(cacheKey, null);
      return null;
    }

    const data: any = await response.json();
    if (data.status !== 'OK') {
      devLogger.error('[DISTANCE] API status error', {
        status: data.status,
        error_message: data.error_message,
      });
      cache.set(cacheKey, null);
      return null;
    }

    const element = data.rows?.[0]?.elements?.[0];
    if (
      element?.status !== 'OK' ||
      !element.duration?.value ||
      !element.distance?.value
    ) {
      devLogger.error('[DISTANCE] element status error', {
        elementStatus: element?.status,
      });
      cache.set(cacheKey, null);
      return null;
    }

    const seconds = Number(element.duration.value) || 0;
    const minutes = roundUpTo5(Math.round(seconds / 60));
    const meters = Number(element.distance.value) || 0;
    const metrics = {
      minutes,
      km: roundKm(meters),
    } satisfies TravelMetrics;

    devLogger.log('[DISTANCE] success', {
      origin: originParam,
      destination: destinationParam,
      seconds,
      minutes,
      meters,
      km: metrics.km,
    });

    cache.set(cacheKey, metrics);
    return metrics;
  } catch (error) {
    devLogger.error('[DISTANCE] fetch error', error);
    cache.set(cacheKey, null);
    return null;
  }
}

export async function getTravelDurationMinutesWithCache(
  origin: TravelPoint,
  destination: TravelPoint,
  cache: TravelDurationCache,
): Promise<number | null> {
  const metrics = await getTravelMetricsWithCache(origin, destination, cache);
  return metrics?.minutes ?? null;
}
