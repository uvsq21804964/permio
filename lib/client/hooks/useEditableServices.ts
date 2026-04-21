'use client';

import { useCallback, useEffect, useState } from 'react';

import { isHttpError } from '@/lib/client/api/request';
import {
  createInstructorService,
  createServiceCategory,
  deleteInstructorService,
  deleteServiceCategory,
  getOwnServiceCatalog,
  updateInstructorService,
  type ServiceCategory,
  type ServicePayload,
  type ServicePricing,
  type ServicesErrorBody,
} from '@/lib/client/api/services-client';

type UseEditableServicesMessages = {
  loadErrorMessage: string;
  genericErrorMessage: string;
  createServiceErrorMessage: string;
  updateServiceErrorMessage: string;
  deleteServiceErrorMessage: string;
  createCategoryErrorMessage: string;
  deleteCategoryErrorMessage: string;
  deleteCategoryHasServicesMessage: string;
};

type CategoryInput = {
  name: string;
  description: string;
};

function toErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

export function useEditableServices(messages: UseEditableServicesMessages) {
  const {
    loadErrorMessage,
    genericErrorMessage,
    createServiceErrorMessage,
    updateServiceErrorMessage,
    deleteServiceErrorMessage,
    createCategoryErrorMessage,
    deleteCategoryErrorMessage,
    deleteCategoryHasServicesMessage,
  } = messages;

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadCatalog = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOwnServiceCatalog({
        fallbackMessage: loadErrorMessage,
      });
      setCategories(data.categories ?? []);
      setServices(data.services ?? []);
      return data;
    } catch (nextError) {
      const message = toErrorMessage(nextError, genericErrorMessage);
      setCategories([]);
      setServices([]);
      setError(message);
      throw nextError;
    } finally {
      setLoading(false);
    }
  }, [genericErrorMessage, loadErrorMessage]);

  useEffect(() => {
    void loadCatalog().catch(() => undefined);
  }, [loadCatalog]);

  const createCategory = useCallback(
    async (payload: CategoryInput) => {
      try {
        setSavingCategory(true);
        setError(null);
        const response = await createServiceCategory(payload, {
          fallbackMessage: createCategoryErrorMessage,
        });
        setCategories((prev) => [...prev, response.category]);
        return response.category;
      } catch (nextError) {
        const message = toErrorMessage(nextError, createCategoryErrorMessage);
        throw new Error(message);
      } finally {
        setSavingCategory(false);
      }
    },
    [createCategoryErrorMessage],
  );

  const createService = useCallback(
    async (payload: ServicePayload) => {
      try {
        setSavingService(true);
        setError(null);
        const response = await createInstructorService(payload, {
          fallbackMessage: createServiceErrorMessage,
        });
        setServices((prev) => [...prev, response.service]);
        return response.service;
      } catch (nextError) {
        const message = toErrorMessage(nextError, createServiceErrorMessage);
        throw new Error(message);
      } finally {
        setSavingService(false);
      }
    },
    [createServiceErrorMessage],
  );

  const updateService = useCallback(
    async (serviceId: number, payload: ServicePayload) => {
      try {
        setSavingService(true);
        setError(null);
        const response = await updateInstructorService(serviceId, payload, {
          fallbackMessage: updateServiceErrorMessage,
        });
        setServices((prev) =>
          prev.map((service) =>
            service.id === response.service.id ? response.service : service,
          ),
        );
        return response.service;
      } catch (nextError) {
        const message = toErrorMessage(nextError, updateServiceErrorMessage);
        throw new Error(message);
      } finally {
        setSavingService(false);
      }
    },
    [updateServiceErrorMessage],
  );

  const deleteService = useCallback(
    async (serviceId: number) => {
      try {
        setError(null);
        await deleteInstructorService(serviceId, {
          fallbackMessage: deleteServiceErrorMessage,
        });
        setServices((prev) =>
          prev.filter((service) => service.id !== serviceId),
        );
      } catch (nextError) {
        const message = toErrorMessage(nextError, deleteServiceErrorMessage);
        setError(message);
        throw new Error(message);
      }
    },
    [deleteServiceErrorMessage],
  );

  const deleteCategory = useCallback(
    async (categoryId: number) => {
      try {
        setError(null);
        await deleteServiceCategory(categoryId, {
          fallbackMessage: deleteCategoryErrorMessage,
        });
        setCategories((prev) =>
          prev.filter((category) => category.id !== categoryId),
        );
        setServices((prev) =>
          prev.filter((service) => service.category_id !== categoryId),
        );
      } catch (nextError) {
        let message = toErrorMessage(nextError, deleteCategoryErrorMessage);

        if (isHttpError<ServicesErrorBody>(nextError)) {
          const body = nextError.data;
          if (body?.error === 'CATEGORY_HAS_SERVICES') {
            message = body.message || deleteCategoryHasServicesMessage;
          }
        }

        setError(message);
        throw new Error(message);
      }
    },
    [deleteCategoryErrorMessage, deleteCategoryHasServicesMessage],
  );

  return {
    categories,
    services,
    loading,
    error,
    savingService,
    savingCategory,
    clearError,
    reload: loadCatalog,
    createCategory,
    createService,
    updateService,
    deleteService,
    deleteCategory,
  };
}
