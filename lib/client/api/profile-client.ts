import { requestJson } from '@/lib/client/api/request';
import type { AddressDetails } from '@/lib/client/utils/address';
import type { MyProfileUser } from '@/lib/client/api/me-client';

type ProfileErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
  details?: string;
};

export type ProfileResponse = {
  user: MyProfileUser;
};

export type ProfileUpdatePayload = {
  name: string;
  planned_minutes: number | null;
  address_label: string | null;
  formatted_address: string | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  phone_country_code?: string | null;
  phone_number?: string | null;
  lat?: number | null;
  lng?: number | null;
  google_place_id?: string | null;
  raw_input?: string | null;
};

export type AccountRecordStatus = {
  exists: boolean;
  user: {
    id: string;
    role: string;
    agencyId: string | null;
  } | null;
};

export type AgencyAssociationPayload = {
  code: string;
  locale: string;
  address: AddressDetails;
  rawInput: string;
};

export type AgencyAssociationResponse = {
  ok: boolean;
  userId: string;
  organizationId: string;
  agencyId: string;
  agencyName: string;
};

export type TrainerOnboardingPayload = {
  agencyName: string;
  phoneCountryCode: string;
  phoneNumber: string;
  websiteUrl: string;
  address: AddressDetails;
  rawInput: string;
  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>;
};

export type TrainerOnboardingResponse = {
  ok: boolean;
  count: number;
  agencyId: string;
  joinCode: string;
  clerkOrgId: string;
  organizationId: string;
};

export function getProfile(options?: { fallbackMessage?: string }) {
  return requestJson<ProfileResponse, ProfileErrorBody>('/api/me/profile', {
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load profile',
  });
}

export function updateProfile(
  payload: ProfileUpdatePayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<ProfileResponse, ProfileErrorBody>('/api/me/profile', {
    method: 'PATCH',
    credentials: 'include',
    body: JSON.stringify(payload),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to update profile',
  });
}

export function deleteMyAccount(options?: { fallbackMessage?: string }) {
  return requestJson<unknown, ProfileErrorBody>('/api/me/delete-account', {
    method: 'DELETE',
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to delete account',
  });
}

export function getAccountRecordStatus(options?: { fallbackMessage?: string }) {
  return requestJson<AccountRecordStatus, ProfileErrorBody>(
    '/api/me/account_bdd',
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to load account status',
    },
  );
}

export function associateToAgency(
  payload: AgencyAssociationPayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<AgencyAssociationResponse, ProfileErrorBody>(
    '/api/agency/association',
    {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        code: payload.code,
        locale: payload.locale,
        address: {
          ...payload.address,
          rawInput: payload.rawInput,
        },
      }),
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to associate agency',
    },
  );
}

export function completeTrainerOnboarding(
  payload: TrainerOnboardingPayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<TrainerOnboardingResponse, ProfileErrorBody>(
    '/api/onboarding/trainer',
    {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify(payload),
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to complete onboarding',
    },
  );
}
