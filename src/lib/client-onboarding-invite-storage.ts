import type { ClientOnboardingInvite } from '@/src/lib/client-onboarding-invite';

const STORAGE_KEY = 'magichango-client-onboarding-invite';

function canUseStorage() {
  return typeof window !== 'undefined' && !!window.sessionStorage;
}

export function readStoredClientOnboardingInvite(): ClientOnboardingInvite | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<ClientOnboardingInvite> | null;
    if (!parsed || typeof parsed.agencyCode !== 'string') {
      return null;
    }

    const agencyCode = parsed.agencyCode.trim().toUpperCase();
    const agencyName =
      typeof parsed.agencyName === 'string' && parsed.agencyName.trim().length > 0
        ? parsed.agencyName.trim()
        : null;

    if (!agencyCode) {
      return null;
    }

    return {
      agencyCode,
      agencyName,
      isClientInvite: true,
    };
  } catch {
    return null;
  }
}

export function storeClientOnboardingInvite(invite: ClientOnboardingInvite) {
  if (!canUseStorage() || !invite.isClientInvite) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        agencyCode: invite.agencyCode,
        agencyName: invite.agencyName,
      }),
    );
  } catch {
    // no-op
  }
}

export function clearStoredClientOnboardingInvite() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
