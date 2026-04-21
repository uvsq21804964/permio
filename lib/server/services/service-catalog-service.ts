import {
  getFirstAgencyInstructor,
  getUserById,
} from '@/lib/server/repositories/user-repository';
import {
  countServicesInCategoryForUser,
  deleteServiceCategoryForUser,
  deleteServicePricingForUser,
  findServiceCategoryForUser,
  getAgencyJoinCodeByUserId,
  getCategoryNameById,
  insertServiceCategory,
  insertServicePricing,
  listServiceCategoriesByUserId,
  listServicePricingByUserId,
  type ServicePricingRecord,
  updateServicePricingForUser,
} from '@/lib/server/repositories/service-repository';

export type InstructorGuardResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; body: { error: string; message?: string } };

export async function requireInstructorUser(
  userId: string
): Promise<InstructorGuardResult> {
  const user = await getUserById(userId);

  if (!user) {
    return { ok: false, status: 404, body: { error: 'USER_NOT_FOUND' } };
  }

  if (user.role !== 'instructor') {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'FORBIDDEN',
        message: 'User is not an instructor',
      },
    };
  }

  return { ok: true, userId };
}

export async function resolveInstructorIdForViewer(userId: string) {
  const me = await getUserById(userId);

  if (!me) {
    return { ok: false as const, status: 404, body: { error: 'USER_NOT_FOUND' } };
  }

  if (me.role === 'instructor') {
    return { ok: true as const, instructorId: me.id };
  }

  const instructor = await getFirstAgencyInstructor(me.agencyId ?? '');
  if (!instructor) {
    return {
      ok: false as const,
      status: 404,
      body: { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
    };
  }

  return { ok: true as const, instructorId: instructor.id };
}

export async function getOwnInstructorServiceCatalog(userId: string) {
  const [categories, services, agencyInfo] = await Promise.all([
    listServiceCategoriesByUserId(userId, 'id'),
    listServicePricingByUserId(userId, 'categoryIdAndId'),
    getAgencyJoinCodeByUserId(userId),
  ]);

  return {
    categories,
    services: services.map(({ is_remote, ...service }) => service),
    joinCode: agencyInfo?.join_code ?? null,
    agencyName: agencyInfo?.agency_name ?? null,
  };
}

export async function getInstructorServiceCatalogForViewer(userId: string) {
  const resolved = await resolveInstructorIdForViewer(userId);
  if (!resolved.ok) return resolved;

  const [categories, servicesRaw] = await Promise.all([
    listServiceCategoriesByUserId(resolved.instructorId, 'name'),
    listServicePricingByUserId(resolved.instructorId, 'categoryNameAndName'),
  ]);

  return {
    ok: true as const,
    instructorId: resolved.instructorId,
    categories,
    services: normalizeServicePricingRecords(servicesRaw),
  };
}

export function validateCategoryPayload(body: any) {
  const nameTrimmed = typeof body?.name === 'string' ? body.name.trim() : '';
  const descTrimmed =
    typeof body?.description === 'string' ? body.description.trim() : '';

  if (!nameTrimmed) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_NAME',
        message: 'Category name is required',
      },
    };
  }

  if (!descTrimmed) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_DESCRIPTION',
        message: 'Category description is required',
      },
    };
  }

  return {
    ok: true as const,
    value: { name: nameTrimmed, description: descTrimmed },
  };
}

export function validateServicePayload(body: any) {
  const categoryId = Number(body?.category_id);
  const nameTrimmed = typeof body?.name === 'string' ? body.name.trim() : '';
  const descTrimmed =
    typeof body?.description === 'string' ? body.description.trim() : '';
  const durationMinutes = Number(body?.duration_minutes);
  const price = Number(body?.price);
  const includesTransport = body?.includes_transport ?? false;
  const isRemote = Boolean(body?.is_remote);

  if (!body?.category_id) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_CATEGORY',
        message: 'category_id is required',
      },
    };
  }

  if (!nameTrimmed) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_NAME',
        message: 'Service name is required',
      },
    };
  }

  if (!descTrimmed) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_DESCRIPTION',
        message: 'Service description is required',
      },
    };
  }

  if (
    durationMinutes == null ||
    Number.isNaN(durationMinutes) ||
    durationMinutes < 0
  ) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_DURATION',
        message: 'Duration must be provided and be >= 0',
      },
    };
  }

  if (price == null || Number.isNaN(price) || price < 0) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'INVALID_PRICE',
        message: 'Price must be >= 0',
      },
    };
  }

  return {
    ok: true as const,
    value: {
      categoryId,
      name: nameTrimmed,
      description: descTrimmed,
      durationMinutes,
      price,
      includesTransport,
      isRemote,
    },
  };
}

export async function ensureCategoryBelongsToUser(
  categoryId: number,
  userId: string
) {
  const category = await findServiceCategoryForUser(categoryId, userId);
  if (!category) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'CATEGORY_NOT_FOUND_OR_FORBIDDEN',
        message: 'Category does not exist for this user',
      },
    };
  }

  return { ok: true as const };
}

export async function createCategoryForInstructor(params: {
  userId: string;
  name: string;
  description: string;
}) {
  return insertServiceCategory(params);
}

export async function createServiceForInstructor(params: {
  userId: string;
  categoryId: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  includesTransport: boolean;
  isRemote: boolean;
}) {
  const inserted = await insertServicePricing(params);
  const categoryName = await getCategoryNameById(inserted.category_id);

  return {
    ...inserted,
    category_name: categoryName,
  };
}

export async function updateServiceForInstructor(params: {
  serviceId: number;
  userId: string;
  categoryId: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  includesTransport: boolean;
  isRemote: boolean;
}) {
  const updated = await updateServicePricingForUser(params);
  if (!updated) return null;

  const categoryName = await getCategoryNameById(updated.category_id);

  return {
    ...updated,
    category_name: categoryName,
  };
}

export async function deleteServiceForInstructor(
  serviceId: number,
  userId: string
) {
  return deleteServicePricingForUser(serviceId, userId);
}

export async function deleteCategoryForInstructor(
  categoryId: number,
  userId: string
) {
  const count = await countServicesInCategoryForUser(categoryId, userId);
  if (count > 0) {
    return {
      ok: false as const,
      status: 400,
      body: {
        error: 'CATEGORY_HAS_SERVICES',
        message:
          'Impossible de supprimer cette catégorie car elle contient encore des services.',
      },
    };
  }

  const deleted = await deleteServiceCategoryForUser(categoryId, userId);
  if (!deleted) {
    return {
      ok: false as const,
      status: 404,
      body: { error: 'CATEGORY_NOT_FOUND_OR_FORBIDDEN' },
    };
  }

  return { ok: true as const };
}

function normalizeServicePricingRecords(
  servicesRaw: ServicePricingRecord[]
): ServicePricingRecord[] {
  return (servicesRaw || []).map((s) => ({
    id: Number(s.id),
    user_id: String(s.user_id),
    category_id: Number(s.category_id),
    category_name: String(s.category_name),
    name: String(s.name),
    description: s.description ?? null,
    duration_minutes:
      s.duration_minutes === null || s.duration_minutes === undefined
        ? null
        : Number(s.duration_minutes),
    price: String(s.price),
    includes_transport: !!s.includes_transport,
    is_remote: !!s.is_remote,
  }));
}
