import { sql } from '@/lib/db';

export type ServiceCategoryRecord = {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
};

export type ServicePricingRecord = {
  id: number;
  user_id: string;
  category_id: number;
  category_name: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  price: string;
  includes_transport: boolean;
  is_remote: boolean;
};

export async function listServiceCategoriesByUserId(
  userId: string,
  orderBy: 'id' | 'name'
): Promise<ServiceCategoryRecord[]> {
  const rows =
    orderBy === 'name'
      ? await sql`
          SELECT id, user_id, name, description
          FROM service_categories
          WHERE user_id = ${userId}
          ORDER BY name
        `
      : await sql`
          SELECT id, user_id, name, description
          FROM service_categories
          WHERE user_id = ${userId}
          ORDER BY id
        `;

  return rows as unknown as ServiceCategoryRecord[];
}

export async function listServicePricingByUserId(
  userId: string,
  orderBy: 'categoryIdAndId' | 'categoryNameAndName'
): Promise<ServicePricingRecord[]> {
  const rows =
    orderBy === 'categoryNameAndName'
      ? await sql`
          SELECT
            s.id,
            s.user_id,
            s.category_id,
            c.name AS category_name,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.includes_transport,
            s.is_remote
          FROM services_pricing s
          JOIN service_categories c ON c.id = s.category_id
          WHERE s.user_id = ${userId}
          ORDER BY c.name, s.name
        `
      : await sql`
          SELECT
            s.id,
            s.user_id,
            s.category_id,
            c.name AS category_name,
            s.name,
            s.description,
            s.duration_minutes,
            s.price,
            s.includes_transport,
            s.is_remote
          FROM services_pricing s
          JOIN service_categories c ON c.id = s.category_id
          WHERE s.user_id = ${userId}
          ORDER BY c.id, s.id
        `;

  return rows as unknown as ServicePricingRecord[];
}

export async function getServicePricingByIdForUser(params: {
  serviceId: number;
  userId: string;
}): Promise<
  Pick<
    ServicePricingRecord,
    'id' | 'is_remote' | 'includes_transport' | 'duration_minutes' | 'price'
  > | null
> {
  const rows = await sql`
    SELECT id, is_remote, includes_transport, duration_minutes, price
    FROM services_pricing
    WHERE id = ${params.serviceId} AND user_id = ${params.userId}
    LIMIT 1
  `;

  return (rows[0] ?? null) as Pick<
    ServicePricingRecord,
    'id' | 'is_remote' | 'includes_transport' | 'duration_minutes' | 'price'
  > | null;
}

export async function getAgencyJoinCodeByUserId(userId: string) {
  const rows = await sql`
    SELECT a.join_code, a.name AS agency_name
    FROM "User" u
    JOIN "Agency" a ON a.id = u."agencyId"
    WHERE u.id = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findServiceCategoryForUser(
  categoryId: number,
  userId: string
) {
  const rows = await sql`
    SELECT id
    FROM service_categories
    WHERE id = ${categoryId} AND user_id = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function insertServiceCategory(params: {
  userId: string;
  name: string;
  description: string;
}) {
  const rows = await sql`
    INSERT INTO service_categories (user_id, name, description)
    VALUES (${params.userId}, ${params.name}, ${params.description})
    RETURNING id, user_id, name, description
  `;

  return rows[0] as ServiceCategoryRecord;
}

export async function insertServicePricing(params: {
  userId: string;
  categoryId: number;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  includesTransport: boolean;
  isRemote: boolean;
}) {
  const rows = await sql`
    INSERT INTO services_pricing (
      user_id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport,
      is_remote
    )
    VALUES (
      ${params.userId},
      ${params.categoryId},
      ${params.name},
      ${params.description},
      ${params.durationMinutes},
      ${params.price},
      ${params.includesTransport},
      ${params.isRemote}
    )
    RETURNING
      id,
      user_id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport,
      is_remote
  `;

  return rows[0];
}

export async function getCategoryNameById(categoryId: number) {
  const rows = await sql`
    SELECT name
    FROM service_categories
    WHERE id = ${categoryId}
    LIMIT 1
  `;

  return rows[0]?.name ?? '';
}

export async function updateServicePricingForUser(params: {
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
  const rows = await sql`
    UPDATE services_pricing
    SET
      category_id = ${params.categoryId},
      name = ${params.name},
      description = ${params.description},
      duration_minutes = ${params.durationMinutes},
      price = ${params.price},
      includes_transport = ${params.includesTransport},
      is_remote = ${params.isRemote}
    WHERE id = ${params.serviceId} AND user_id = ${params.userId}
    RETURNING
      id,
      user_id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport,
      is_remote
  `;

  return rows[0] ?? null;
}

export async function deleteServicePricingForUser(
  serviceId: number,
  userId: string
) {
  const rows = await sql`
    DELETE FROM services_pricing
    WHERE id = ${serviceId} AND user_id = ${userId}
    RETURNING id
  `;

  return rows[0] ?? null;
}

export async function countServicesInCategoryForUser(
  categoryId: number,
  userId: string
) {
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM services_pricing
    WHERE user_id = ${userId} AND category_id = ${categoryId}
  `;

  return Number(rows[0]?.cnt ?? 0);
}

export async function deleteServiceCategoryForUser(
  categoryId: number,
  userId: string
) {
  const rows = await sql`
    DELETE FROM service_categories
    WHERE id = ${categoryId} AND user_id = ${userId}
    RETURNING id
  `;

  return rows[0] ?? null;
}
