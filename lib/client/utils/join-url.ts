'use client';

export function buildJoinUrl(joinCode: string | null | undefined, locale: string) {
  const normalizedCode = joinCode?.trim();
  if (!normalizedCode) {
    return '';
  }

  const normalizedLocale = locale?.trim() || 'en';
  const path = `/${normalizedLocale}/join/${encodeURIComponent(normalizedCode)}`;
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const origin =
    configuredBaseUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return origin ? `${origin.replace(/\/$/, '')}${path}` : path;
}
