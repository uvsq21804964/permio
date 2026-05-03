'use client';

export type ButtonTrackingMetadata = Record<string, string | number | boolean | null>;

export type TrackButtonClickPayload = {
  buttonKey: string;
  buttonLabel?: string | null;
  buttonContext?: string | null;
  durationMs?: number | null;
  eventType?: 'button_click' | 'page_view' | 'page_leave';
  pagePath?: string | null;
  targetHref?: string | null;
  locale?: string | null;
  metadata?: ButtonTrackingMetadata | null;
  referrer?: string | null;
};

function normalizeText(value: string | null | undefined, maxLength = 255) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export function trackButtonClick(payload: TrackButtonClickPayload) {
  if (typeof window === 'undefined') {
    return;
  }

  const body = JSON.stringify({
    buttonKey: normalizeText(payload.buttonKey, 160),
    buttonLabel: normalizeText(payload.buttonLabel, 255),
    buttonContext: normalizeText(payload.buttonContext, 255),
    durationMs: payload.durationMs ?? null,
    eventType: payload.eventType ?? 'button_click',
    pagePath: normalizeText(payload.pagePath ?? window.location.pathname, 500),
    targetHref: normalizeText(payload.targetHref, 1000),
    locale: normalizeText(payload.locale, 20),
    metadata: payload.metadata ?? null,
    referrer: normalizeText(payload.referrer ?? document.referrer, 1000),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/button-tracking/event', blob);
      return;
    }
  } catch {}

  fetch('/api/button-tracking/event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
    credentials: 'same-origin',
  }).catch(() => null);
}
