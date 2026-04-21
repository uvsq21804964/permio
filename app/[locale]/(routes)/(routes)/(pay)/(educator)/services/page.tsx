'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';

import { CategoryFormDialog, type CategoryDraft } from '@/components/services/CategoryFormDialog';
import { EditableServicesCatalog } from '@/components/services/EditableServicesCatalog';
import { ServiceFormDialog, type ServiceDraft } from '@/components/services/ServiceFormDialog';
import { useEditableServices } from '@/lib/client/hooks/useEditableServices';
import type { ServicePricing } from '@/lib/client/api/services-client';

type ServiceModalMode = 'create' | 'edit';

function buildEmptyServiceDraft(categoryId: number): ServiceDraft {
  return {
    id: null,
    categoryId,
    name: '',
    description: '',
    duration_minutes: '',
    price: '',
    includes_transport: false,
    is_remote: false,
  };
}

function buildServiceDraft(service: ServicePricing): ServiceDraft {
  return {
    id: service.id,
    categoryId: service.category_id,
    name: service.name || '',
    description: service.description || '',
    duration_minutes:
      service.duration_minutes != null ? String(service.duration_minutes) : '',
    price: service.price != null ? String(service.price) : '',
    includes_transport: service.includes_transport ?? false,
    is_remote: service.is_remote ?? false,
  };
}

export default function ServicesPage() {
  const t = useTranslations('services');

  const {
    categories,
    services,
    loading,
    error,
    savingService,
    savingCategory,
    clearError,
    createCategory,
    createService,
    updateService,
    deleteService,
    deleteCategory,
  } = useEditableServices({
    loadErrorMessage: t('errors.loadServices'),
    genericErrorMessage: t('alerts.errorGeneric'),
    createServiceErrorMessage: t('errors.createService'),
    updateServiceErrorMessage: t('errors.updateService'),
    deleteServiceErrorMessage: t('errors.deleteService'),
    createCategoryErrorMessage: t('errors.createCategory'),
    deleteCategoryErrorMessage: t('errors.deleteCategory'),
    deleteCategoryHasServicesMessage: t('errors.deleteCategoryHasServices'),
  });

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] =
    useState<ServiceModalMode>('edit');
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(null);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({
    name: '',
    description: '',
  });
  const [categoryFormError, setCategoryFormError] = useState<string | null>(
    null,
  );

  const openCreateServiceModal = (categoryId?: number) => {
    setServiceModalMode('create');
    setServiceDraft(buildEmptyServiceDraft(categoryId || (categories[0]?.id ?? 0)));
    setServiceFormError(null);
    setSuccessMessage(null);
    clearError();
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServicePricing) => {
    setServiceModalMode('edit');
    setServiceDraft(buildServiceDraft(service));
    setServiceFormError(null);
    setSuccessMessage(null);
    clearError();
    setServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    if (savingService) {
      return;
    }

    setServiceModalOpen(false);
    setServiceDraft(null);
  };

  const handleServiceDraftChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    if (!serviceDraft) {
      return;
    }

    const { name, value, type, checked } = event.target as HTMLInputElement;

    if (name === 'categoryId') {
      setServiceDraft((prev) =>
        prev
          ? {
              ...prev,
              categoryId: Number(value),
            }
          : prev,
      );
      return;
    }

    setServiceDraft((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
          }
        : prev,
    );
  };

  const handleSaveService = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!serviceDraft) {
      return;
    }

    const name = serviceDraft.name.trim();
    if (!name) {
      setServiceFormError(t('errors.serviceNameRequired'));
      return;
    }

    if (!serviceDraft.categoryId) {
      setServiceFormError(t('errors.serviceCategoryRequired'));
      return;
    }

    const description = serviceDraft.description.trim();
    if (!description) {
      setServiceFormError(t('errors.serviceDescriptionRequired'));
      return;
    }

    if (!serviceDraft.duration_minutes.trim()) {
      setServiceFormError(t('errors.serviceDurationRequired'));
      return;
    }

    const duration = Number.parseInt(serviceDraft.duration_minutes.trim(), 10);
    if (Number.isNaN(duration) || duration < 0) {
      setServiceFormError(t('errors.serviceDurationInvalid'));
      return;
    }

    if (!serviceDraft.price.trim()) {
      setServiceFormError(t('errors.servicePriceRequired'));
      return;
    }

    const price = Number.parseFloat(serviceDraft.price.trim());
    if (Number.isNaN(price) || price < 0) {
      setServiceFormError(t('errors.servicePriceInvalid'));
      return;
    }

    const payload = {
      category_id: serviceDraft.categoryId,
      name,
      description,
      duration_minutes: duration,
      price,
      includes_transport: serviceDraft.is_remote
        ? false
        : serviceDraft.includes_transport,
      is_remote: serviceDraft.is_remote,
    };

    try {
      setServiceFormError(null);
      setSuccessMessage(null);

      if (serviceModalMode === 'create') {
        await createService(payload);
        setSuccessMessage(t('alerts.successServiceCreated'));
      } else if (serviceDraft.id != null) {
        await updateService(serviceDraft.id, payload);
        setSuccessMessage(t('alerts.successServiceUpdated'));
      }

      setServiceModalOpen(false);
      setServiceDraft(null);
    } catch (nextError) {
      if (nextError instanceof Error) {
        setServiceFormError(nextError.message);
        return;
      }

      setServiceFormError(
        serviceModalMode === 'create'
          ? t('errors.createService')
          : t('errors.updateService'),
      );
    }
  };

  const handleDeleteService = async (service: ServicePricing) => {
    if (!window.confirm(t('confirm.deleteService', { name: service.name }))) {
      return;
    }

    try {
      setSuccessMessage(null);
      await deleteService(service.id);
      setSuccessMessage(t('alerts.successServiceDeleted'));
    } catch {
      return;
    }
  };

  const openCreateCategoryModal = () => {
    setCategoryDraft({
      name: '',
      description: '',
    });
    setCategoryFormError(null);
    setSuccessMessage(null);
    clearError();
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (savingCategory) {
      return;
    }

    setCategoryModalOpen(false);
  };

  const handleCategoryDraftChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setCategoryDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = categoryDraft.name.trim();
    const description = categoryDraft.description.trim();

    if (!name) {
      setCategoryFormError(t('errors.categoryNameRequired'));
      return;
    }

    if (!description) {
      setCategoryFormError(t('errors.categoryDescriptionRequired'));
      return;
    }

    try {
      setCategoryFormError(null);
      setSuccessMessage(null);
      await createCategory({
        name,
        description,
      });
      setSuccessMessage(t('alerts.successCategoryCreated'));
      setCategoryModalOpen(false);
    } catch (nextError) {
      if (nextError instanceof Error) {
        setCategoryFormError(nextError.message);
        return;
      }

      setCategoryFormError(t('errors.createCategory'));
    }
  };

  const handleDeleteCategory = async (category: { id: number; name: string }) => {
    if (!window.confirm(t('confirm.deleteCategory', { name: category.name }))) {
      return;
    }

    try {
      setSuccessMessage(null);
      await deleteCategory(category.id);
      setSuccessMessage(t('alerts.successCategoryDeleted'));
    } catch {
      return;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-4xl rounded-2xl border bg-card p-6 shadow-sm space-y-4 animate-pulse">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
            <div className="h-24 rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg md:text-xl font-semibold">{t('title')}</h1>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={openCreateCategoryModal}
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
          >
            + {t('buttons.addCategory')}
          </button>
        </header>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs md:text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <EditableServicesCatalog
          categories={categories}
          services={services}
          onAddService={openCreateServiceModal}
          onEditService={openEditServiceModal}
          onDeleteService={handleDeleteService}
          onDeleteCategory={handleDeleteCategory}
          t={t}
        />
      </div>

      <ServiceFormDialog
        open={serviceModalOpen}
        mode={serviceModalMode}
        draft={serviceDraft}
        categories={categories}
        saving={savingService}
        formError={serviceFormError}
        onClose={closeServiceModal}
        onChange={handleServiceDraftChange}
        onSubmit={handleSaveService}
        t={t}
      />

      <CategoryFormDialog
        open={categoryModalOpen}
        draft={categoryDraft}
        saving={savingCategory}
        formError={categoryFormError}
        onClose={closeCategoryModal}
        onChange={handleCategoryDraftChange}
        onSubmit={handleSaveCategory}
        t={t}
      />
    </main>
  );
}
