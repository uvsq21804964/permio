'use client';

type AttributionMetadata = Record<string, string | number | boolean | null>;

type StoredMarketingAttribution = {
  visitorId: string;
  firstLandingPath: string | null;
  firstReferrer: string | null;
  firstSeenAt: string;
  firstUtmSource: string | null;
  firstUtmMedium: string | null;
  firstUtmCampaign: string | null;
  firstUtmContent: string | null;
  firstUtmTerm: string | null;
  lastLandingPath: string | null;
  lastReferrer: string | null;
  lastSeenAt: string;
  lastUtmSource: string | null;
  lastUtmMedium: string | null;
  lastUtmCampaign: string | null;
  lastUtmContent: string | null;
  lastUtmTerm: string | null;
};

const STORAGE_KEY = 'magichango_marketing_attribution_v1';

function createVisitorId() {
  try {
    return window.crypto.randomUUID();
  } catch {
    return `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  }
}

function normalize(value: string | null | undefined, maxLength = 500) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

function readStoredAttribution(): StoredMarketingAttribution | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as StoredMarketingAttribution;
  } catch {
    return null;
  }
}

function writeStoredAttribution(value: StoredMarketingAttribution) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Attribution should never block the booking or signup flows.
  }
}

function getCurrentAttribution() {
  const url = new URL(window.location.href);
  const landingPath = normalize(`${url.pathname}${url.search}`, 1000);

  return {
    landingPath,
    referrer: normalize(document.referrer, 1000),
    utmSource: normalize(url.searchParams.get('utm_source'), 120),
    utmMedium: normalize(url.searchParams.get('utm_medium'), 120),
    utmCampaign: normalize(url.searchParams.get('utm_campaign'), 180),
    utmContent: normalize(url.searchParams.get('utm_content'), 180),
    utmTerm: normalize(url.searchParams.get('utm_term'), 180),
  };
}

export function captureMarketingAttribution() {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getCurrentAttribution();
  const stored = readStoredAttribution();
  const now = new Date().toISOString();

  const next: StoredMarketingAttribution = {
    visitorId: stored?.visitorId ?? createVisitorId(),
    firstLandingPath: stored?.firstLandingPath ?? current.landingPath,
    firstReferrer: stored?.firstReferrer ?? current.referrer,
    firstSeenAt: stored?.firstSeenAt ?? now,
    firstUtmSource: stored?.firstUtmSource ?? current.utmSource,
    firstUtmMedium: stored?.firstUtmMedium ?? current.utmMedium,
    firstUtmCampaign: stored?.firstUtmCampaign ?? current.utmCampaign,
    firstUtmContent: stored?.firstUtmContent ?? current.utmContent,
    firstUtmTerm: stored?.firstUtmTerm ?? current.utmTerm,
    lastLandingPath: current.landingPath,
    lastReferrer: current.referrer ?? stored?.lastReferrer ?? null,
    lastSeenAt: now,
    lastUtmSource: current.utmSource ?? stored?.lastUtmSource ?? null,
    lastUtmMedium: current.utmMedium ?? stored?.lastUtmMedium ?? null,
    lastUtmCampaign: current.utmCampaign ?? stored?.lastUtmCampaign ?? null,
    lastUtmContent: current.utmContent ?? stored?.lastUtmContent ?? null,
    lastUtmTerm: current.utmTerm ?? stored?.lastUtmTerm ?? null,
  };

  writeStoredAttribution(next);
}

export function getMarketingAttributionMetadata(): AttributionMetadata {
  const stored = readStoredAttribution();
  if (!stored) {
    return {};
  }

  return {
    marketing_visitor_id: stored.visitorId ?? null,
    first_landing_path: stored.firstLandingPath,
    first_referrer: stored.firstReferrer,
    first_seen_at: stored.firstSeenAt,
    first_utm_source: stored.firstUtmSource,
    first_utm_medium: stored.firstUtmMedium,
    first_utm_campaign: stored.firstUtmCampaign,
    first_utm_content: stored.firstUtmContent,
    first_utm_term: stored.firstUtmTerm,
    last_landing_path: stored.lastLandingPath,
    last_referrer: stored.lastReferrer,
    last_seen_at: stored.lastSeenAt,
    last_utm_source: stored.lastUtmSource,
    last_utm_medium: stored.lastUtmMedium,
    last_utm_campaign: stored.lastUtmCampaign,
    last_utm_content: stored.lastUtmContent,
    last_utm_term: stored.lastUtmTerm,
  };
}
