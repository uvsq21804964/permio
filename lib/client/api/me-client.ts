import { requestJson } from '@/lib/client/api/request';

export type MyProfileUser = {
  id: string;
  name: string | null;
  role: string;
  agencyId: string | null;
  planned_minutes: number | null;
  remaining_minutes: number | null;
  last_validated_week_start: string | null;
  last_validated_at: string | null;
  createdAt: string;
  updatedAt: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  street: string | null;
  street_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  country_code: string | null;
  phone_country_code?: string | null;
  phone_number?: string | null;
  google_place_id: string | null;
  raw_input: string | null;
  address_label: string | null;
  is_primary: boolean | null;
  joinCode?: string | null;
  agencyName?: string | null;
};

type MyProfileResponse = {
  user: MyProfileUser;
};

type ProfileErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

export function getMyProfile(options?: { fallbackMessage?: string }) {
  return requestJson<MyProfileResponse, ProfileErrorBody>('/api/me/profile', {
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load profile',
  });
}

export type MyRoleResponse = {
  id: string;
  name: string;
  role: string;
  error?: string;
};

export type MyHoursResponse = {
  plannedMinutes: number | null;
  remainingMinutes: number | null;
  role: string | null;
};

export type MySubscriptionStatus = {
  loggedIn: boolean;
  role: string | null;
  subscription_cancel_at_period_end: boolean | null;
  subscription_status: string | null;
};

export function getMyRole(options?: { fallbackMessage?: string }) {
  return requestJson<MyRoleResponse, ProfileErrorBody>('/api/me/role', {
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load role',
  });
}

export function getMyHours(options?: { fallbackMessage?: string }) {
  return requestJson<MyHoursResponse, ProfileErrorBody>('/api/me/hours', {
    credentials: 'include',
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load hours',
  });
}

export function getMySubscriptionStatus(options?: { fallbackMessage?: string }) {
  return requestJson<MySubscriptionStatus, ProfileErrorBody>(
    '/api/me/subscription',
    {
      cache: 'no-store',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to load subscription status',
    },
  );
}
