'use client';

import { useEffect, useState, FormEvent, ChangeEvent } from 'react';

type ServiceCategory = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

type ServicePricing = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: number | string;
  includes_transport: boolean;
};

type ServiceDraft = {
  id: number | null; // null = création, !null = édition
  categoryId: number;
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
  includes_transport: boolean;
};

type CategoryDraft = {
  name: string;
  description: string;
};

type ServiceModalMode = 'create' | 'edit';

export default function ServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modale service (create / edit)
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] =
    useState<ServiceModalMode>('edit');
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft | null>(null);
  const [savingService, setSavingService] = useState(false);
  const [serviceFormError, setServiceFormError] = useState<string | null>(null);

  // Modale catégorie (create)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>({
    name: '',
    description: '',
  });
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(
    null
  );

  const loadServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/me/services');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Impossible de charger les services');
      }
      const data = await res.json();
      setCategories(data.categories || []);
      setServices(data.services || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur lors du chargement des services.');
      setCategories([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // ─────────────────────  MODALE SERVICE (CREATE / EDIT)  ─────────────────────

  const openCreateServiceModal = (categoryId?: number) => {
    setServiceModalMode('create');
    setServiceDraft({
      id: null,
      categoryId: categoryId || (categories[0]?.id ?? 0),
      name: '',
      description: '',
      duration_minutes: '',
      price: '',
      includes_transport: false,
    });
    setServiceFormError(null);
    setSuccessMessage(null);
    setServiceModalOpen(true);
  };

  const openEditServiceModal = (service: ServicePricing) => {
    setServiceModalMode('edit');
    setServiceDraft({
      id: service.id,
      categoryId: service.category_id,
      name: service.name || '',
      description: service.description || '',
      duration_minutes:
        service.duration_minutes != null
          ? String(service.duration_minutes)
          : '',
      price: service.price != null ? String(service.price) : '',
      includes_transport: service.includes_transport ?? false,
    });
    setServiceFormError(null);
    setSuccessMessage(null);
    setServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    if (savingService) return;
    setServiceModalOpen(false);
    setServiceDraft(null);
  };

  const handleServiceDraftChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!serviceDraft) return;
    const { name, value, type, checked } = e.target as any;

    if (name === 'categoryId') {
      setServiceDraft((prev) =>
        prev
          ? {
              ...prev,
              categoryId: Number(value),
            }
          : prev
      );
      return;
    }

    setServiceDraft((prev) =>
      prev
        ? {
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
          }
        : prev
    );
  };

  const handleSaveService = async (e: FormEvent) => {
    e.preventDefault();
    if (!serviceDraft) return;

    // Nom obligatoire
    const name = serviceDraft.name.trim();
    if (!name) {
      setServiceFormError('Le nom du service est obligatoire.');
      return;
    }

    // Catégorie obligatoire
    if (!serviceDraft.categoryId) {
      setServiceFormError('La catégorie est obligatoire.');
      return;
    }

    // Description obligatoire
    const description = serviceDraft.description.trim();
    if (!description) {
      setServiceFormError('La description du service est obligatoire.');
      return;
    }

    // Durée obligatoire + nombre >= 0
    if (!serviceDraft.duration_minutes.trim()) {
      setServiceFormError('La durée (en minutes) est obligatoire.');
      return;
    }
    const duration = Number.parseInt(serviceDraft.duration_minutes.trim(), 10);
    if (Number.isNaN(duration) || duration < 0) {
      setServiceFormError(
        'La durée doit être un nombre supérieur ou égal à 0.'
      );
      return;
    }

    // Prix obligatoire + nombre >= 0
    if (!serviceDraft.price.trim()) {
      setServiceFormError('Le prix est obligatoire.');
      return;
    }
    const price = Number.parseFloat(serviceDraft.price.trim());
    if (Number.isNaN(price) || price < 0) {
      setServiceFormError('Le prix doit être un nombre supérieur ou égal à 0.');
      return;
    }

    const payload = {
      category_id: serviceDraft.categoryId,
      name,
      description,
      duration_minutes: duration,
      price,
      includes_transport: serviceDraft.includes_transport,
    };

    try {
      setSavingService(true);
      setServiceFormError(null);
      setSuccessMessage(null);

      let res: Response;

      if (serviceModalMode === 'create') {
        res = await fetch('/api/me/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind: 'service',
            ...payload,
          }),
        });
      } else {
        res = await fetch('/api/me/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: serviceDraft.id,
            ...payload,
          }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ||
            (serviceModalMode === 'create'
              ? 'Impossible de créer le service'
              : 'Impossible de mettre à jour le service')
        );
      }

      const data = await res.json();
      const updated: ServicePricing = data.service;

      if (serviceModalMode === 'create') {
        setServices((prev) => [...prev, updated]);
        setSuccessMessage('Service créé avec succès.');
      } else {
        setServices((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s))
        );
        setSuccessMessage('Service mis à jour avec succès.');
      }

      setServiceModalOpen(false);
      setServiceDraft(null);
    } catch (err: any) {
      console.error(err);
      setServiceFormError(
        err?.message ||
          (serviceModalMode === 'create'
            ? 'Erreur lors de la création du service.'
            : 'Erreur lors de la mise à jour du service.')
      );
    } finally {
      setSavingService(false);
    }
  };

  const handleDeleteService = async (service: ServicePricing) => {
    if (
      !window.confirm(
        `Supprimer le service "${service.name}" ? Cette action est définitive.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/me/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'service',
          id: service.id,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Impossible de supprimer le service.');
      }

      setServices((prev) => prev.filter((s) => s.id !== service.id));
      setSuccessMessage('Service supprimé avec succès.');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la suppression du service.');
    }
  };

  // ─────────────────────  MODALE CATÉGORIE (CREATE)  ─────────────────────

  const openCreateCategoryModal = () => {
    setCategoryDraft({
      name: '',
      description: '',
    });
    setCategoryFormError(null);
    setSuccessMessage(null);
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    if (savingCategory) return;
    setCategoryModalOpen(false);
  };

  const handleCategoryDraftChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCategoryDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveCategory = async (e: FormEvent) => {
    e.preventDefault();

    const name = categoryDraft.name.trim();
    const description = categoryDraft.description.trim();

    if (!name) {
      setCategoryFormError('Le nom de la catégorie est obligatoire.');
      return;
    }

    if (!description) {
      setCategoryFormError('La description de la catégorie est obligatoire.');
      return;
    }

    try {
      setSavingCategory(true);
      setCategoryFormError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/me/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'category',
          name,
          description,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Impossible de créer la catégorie.');
      }

      const data = await res.json();
      const newCat: ServiceCategory = data.category;

      setCategories((prev) => [...prev, newCat]);
      setSuccessMessage('Catégorie créée avec succès.');
      setCategoryModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setCategoryFormError(
        err?.message || 'Erreur lors de la création de la catégorie.'
      );
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (cat: ServiceCategory) => {
    if (
      !window.confirm(
        `Supprimer la catégorie "${cat.name}" ? Tous les services doivent être supprimés ou déplacés avant.`
      )
    ) {
      return;
    }

    try {
      setError(null);
      setSuccessMessage(null);

      const res = await fetch('/api/me/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'category',
          id: cat.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Cas particulier : la catégorie contient encore des services
        if (data.error === 'CATEGORY_HAS_SERVICES') {
          setError(
            data.message ||
              'Impossible de supprimer cette catégorie car elle contient encore des services. Supprime ou déplace les services avant.'
          );
          return;
        }

        // Autres erreurs
        throw new Error(
          data.message || data.error || 'Impossible de supprimer la catégorie.'
        );
      }

      // Succès : on retire la catégorie et ses services du state
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setServices((prev) => prev.filter((s) => s.category_id !== cat.id));
      setSuccessMessage('Catégorie supprimée avec succès.');
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message || 'Erreur lors de la suppression de la catégorie.'
      );
    }
  };

  // ─────────────────────  RENDER  ─────────────────────

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
            <h1 className="text-lg md:text-xl font-semibold">
              Mes services et tarifs
            </h1>
            <p className="text-xs text-muted-foreground">
              Vos services sont disponibles à la commande pour vos clients qui
              peuvent réserver un créneau en autonomie.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateCategoryModal}
            className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5"
          >
            + Ajouter une catégorie
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

        {/* Liste des catégories + services */}
        <div className="space-y-6">
          {categories.length === 0 && !error && (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              Aucune catégorie ou service configuré pour l’instant.
            </div>
          )}

          {categories.map((cat) => {
            const catServices = services.filter(
              (s) => s.category_id === cat.id
            );

            return (
              <section
                key={cat.id}
                className="rounded-2xl border bg-card p-4 md:p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold break-words">
                      {cat.name}
                    </h2>
                    {cat.description && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {cat.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openCreateServiceModal(cat.id)}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 whitespace-nowrap shrink-0"
                    >
                      + Service
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="inline-flex items-center justify-center rounded-full border border-red-300 px-3 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {catServices.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun service dans cette catégorie pour l’instant.
                  </p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {catServices.map((service) => {
                      const priceNum = Number(service.price);
                      const priceLabel = Number.isNaN(priceNum)
                        ? `${service.price} $`
                        : `${priceNum.toFixed(2)} $`;

                      return (
                        <div
                          key={service.id}
                          className="rounded-xl border bg-background p-3 flex flex-col justify-between"
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold flex-1 break-words">
                                {service.name}
                              </h3>
                              <div className="flex gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditServiceModal(service)}
                                  className="inline-flex items-center justify-center rounded-full border px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5 whitespace-nowrap shrink-0"
                                >
                                  Modifier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteService(service)}
                                  className="inline-flex items-center justify-center rounded-full border border-red-300 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 whitespace-nowrap shrink-0"
                                >
                                  Supprimer
                                </button>
                              </div>
                            </div>

                            {service.description && (
                              <p className="text-xs text-muted-foreground whitespace-pre-line">
                                {service.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex flex-col">
                              <span className="font-medium">{priceLabel}</span>
                              {service.duration_minutes != null && (
                                <span className="text-muted-foreground">
                                  {service.duration_minutes} min
                                </span>
                              )}
                            </div>
                            {service.includes_transport && (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] text-emerald-700">
                                Inclut le transport
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* MODALE SERVICE (CREATE / EDIT) */}
      {serviceModalOpen && serviceDraft && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                {serviceModalMode === 'create'
                  ? 'Créer un service'
                  : 'Modifier le service & tarif'}
              </h2>
              <button
                type="button"
                onClick={closeServiceModal}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="categoryId"
                  className="text-xs font-medium text-foreground"
                >
                  Catégorie
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={serviceDraft.categoryId}
                  onChange={handleServiceDraftChange}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value={0}>Sélectionner une catégorie…</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-medium text-foreground"
                >
                  Nom du service
                </label>
                <input
                  id="name"
                  name="name"
                  value={serviceDraft.name}
                  onChange={handleServiceDraftChange}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="description"
                  className="text-xs font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceDraft.description}
                  onChange={handleServiceDraftChange}
                  rows={4}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="duration_minutes"
                    className="text-xs font-medium text-foreground"
                  >
                    Durée (min)
                  </label>
                  <input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min={0}
                    value={serviceDraft.duration_minutes}
                    onChange={handleServiceDraftChange}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="ex : 30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="price"
                    className="text-xs font-medium text-foreground"
                  >
                    Prix ($)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={serviceDraft.price}
                    onChange={handleServiceDraftChange}
                    className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="ex : 45"
                  />
                </div>

                <div className="flex items-end">
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      name="includes_transport"
                      checked={serviceDraft.includes_transport}
                      onChange={handleServiceDraftChange}
                      className="rounded border"
                    />
                    Inclut le transport
                  </label>
                </div>
              </div>

              {serviceFormError && (
                <p className="text-xs text-red-600">{serviceFormError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  disabled={savingService}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingService
                    ? 'Enregistrement…'
                    : serviceModalMode === 'create'
                    ? 'Créer'
                    : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CATÉGORIE (CREATE) */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border shadow-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Créer une catégorie</h2>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="cat_name"
                  className="text-xs font-medium text-foreground"
                >
                  Nom de la catégorie
                </label>
                <input
                  id="cat_name"
                  name="name"
                  value={categoryDraft.name}
                  onChange={handleCategoryDraftChange}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="cat_description"
                  className="text-xs font-medium text-foreground"
                >
                  Description
                </label>
                <textarea
                  id="cat_description"
                  name="description"
                  value={categoryDraft.description}
                  onChange={handleCategoryDraftChange}
                  rows={3}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              {categoryFormError && (
                <p className="text-xs text-red-600">{categoryFormError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCategoryModal}
                  disabled={savingCategory}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCategory ? 'Création…' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
