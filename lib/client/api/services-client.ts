import { requestJson } from '@/lib/client/api/request';

export type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

export type ServicePricing = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | string;
  includes_transport: boolean;
  is_remote: boolean;
};

export type OwnServicesResponse = {
  categories: ServiceCategory[];
  services: ServicePricing[];
  joinCode?: string | null;
  agencyName?: string | null;
};

export type InstructorServicesResponse = {
  instructorId: string;
  categories: ServiceCategory[];
  services: ServicePricing[];
};

export type ServicePayload = {
  category_id: number;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  includes_transport: boolean;
  is_remote: boolean;
};

export type CategoryPayload = {
  name: string;
  description: string;
};

type ServicesErrorBody = {
  error?: string;
  message?: string;
  detail?: string;
};

export function getOwnServiceCatalog(options?: { fallbackMessage?: string }) {
  return requestJson<OwnServicesResponse, ServicesErrorBody>('/api/me/services', {
    fallbackMessage: options?.fallbackMessage ?? 'Failed to load services',
  });
}

export function getInstructorServiceCatalog(options?: {
  fallbackMessage?: string;
}) {
  return requestJson<InstructorServicesResponse, ServicesErrorBody>(
    '/api/me/instructor-services',
    {
      credentials: 'include',
      fallbackMessage:
        options?.fallbackMessage ?? 'Failed to fetch instructor services',
    },
  );
}

export function createServiceCategory(
  payload: CategoryPayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true; category: ServiceCategory }, ServicesErrorBody>(
    '/api/me/services',
    {
      method: 'POST',
      body: JSON.stringify({
        kind: 'category',
        ...payload,
      }),
      fallbackMessage: options?.fallbackMessage ?? 'Failed to create category',
    },
  );
}

export function createInstructorService(
  payload: ServicePayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true; service: ServicePricing }, ServicesErrorBody>(
    '/api/me/services',
    {
      method: 'POST',
      body: JSON.stringify({
        kind: 'service',
        ...payload,
      }),
      fallbackMessage: options?.fallbackMessage ?? 'Failed to create service',
    },
  );
}

export function updateInstructorService(
  serviceId: number,
  payload: ServicePayload,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true; service: ServicePricing }, ServicesErrorBody>(
    '/api/me/services',
    {
      method: 'PATCH',
      body: JSON.stringify({
        id: serviceId,
        ...payload,
      }),
      fallbackMessage: options?.fallbackMessage ?? 'Failed to update service',
    },
  );
}

export function deleteInstructorService(
  serviceId: number,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true }, ServicesErrorBody>('/api/me/services', {
    method: 'DELETE',
    body: JSON.stringify({
      kind: 'service',
      id: serviceId,
    }),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to delete service',
  });
}

export function deleteServiceCategory(
  categoryId: number,
  options?: { fallbackMessage?: string },
) {
  return requestJson<{ ok: true }, ServicesErrorBody>('/api/me/services', {
    method: 'DELETE',
    body: JSON.stringify({
      kind: 'category',
      id: categoryId,
    }),
    fallbackMessage: options?.fallbackMessage ?? 'Failed to delete category',
  });
}

export type { ServicesErrorBody };
