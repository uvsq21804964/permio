// app/api/me/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

async function requireInstructor(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId) {
    return { error: 'Unauthorized', status: 401 } as const;
  }

  const users = await sql`
    SELECT "id", "role"
    FROM "User"
    WHERE "id" = ${userId}
    LIMIT 1
  `;

  if (users.length === 0) {
    return { error: 'USER_NOT_FOUND', status: 404 } as const;
  }

  if (users[0].role !== 'instructor') {
    return {
      error: 'FORBIDDEN',
      message: 'User is not an instructor',
      status: 403,
    } as const;
  }

  return { userId } as const;
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireInstructor(req);
    if ('error' in guard) {
      const { status, ...rest } = guard;
      return NextResponse.json(rest, { status });
    }
    const { userId } = guard;

    const categories = await sql`
      SELECT
        id,
        user_id,
        name,
        description
      FROM service_categories
      WHERE user_id = ${userId}
      ORDER BY id
    `;

    const services = await sql`
      SELECT
        s.id,
        s.user_id,
        s.category_id,
        c.name AS category_name,
        s.name,
        s.description,
        s.duration_minutes,
        s.price,
        s.includes_transport
      FROM services_pricing s
      JOIN service_categories c ON c.id = s.category_id
      WHERE s.user_id = ${userId}
      ORDER BY c.id, s.id
    `;

    return NextResponse.json({ categories, services }, { status: 200 });
  } catch (err: any) {
    console.error('[GET /api/me/services] error:', err);
    return NextResponse.json(
      { error: 'Failed to load services', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireInstructor(req);
    if ('error' in guard) {
      const { status, ...rest } = guard;
      return NextResponse.json(rest, { status });
    }
    const { userId } = guard;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const { kind } = body as { kind?: 'category' | 'service' };

    if (kind === 'category') {
      const { name, description } = body;

      const nameTrimmed = typeof name === 'string' ? name.trim() : '';
      const descTrimmed =
        typeof description === 'string' ? description.trim() : '';

      if (!nameTrimmed) {
        return NextResponse.json(
          { error: 'INVALID_NAME', message: 'Category name is required' },
          { status: 400 }
        );
      }

      if (!descTrimmed) {
        return NextResponse.json(
          {
            error: 'INVALID_DESCRIPTION',
            message: 'Category description is required',
          },
          { status: 400 }
        );
      }

      const inserted = await sql`
    INSERT INTO service_categories (user_id, name, description)
    VALUES (${userId}, ${nameTrimmed}, ${descTrimmed})
    RETURNING id, user_id, name, description
  `;

      return NextResponse.json(
        { ok: true, category: inserted[0] },
        { status: 201 }
      );
    }

    if (kind === 'service') {
      const {
        category_id,
        name,
        description,
        duration_minutes,
        price,
        includes_transport,
      } = body;

      if (!category_id) {
        return NextResponse.json(
          { error: 'INVALID_CATEGORY', message: 'category_id is required' },
          { status: 400 }
        );
      }

      const nameTrimmed = typeof name === 'string' ? name.trim() : '';
      const descTrimmed =
        typeof description === 'string' ? description.trim() : '';

      if (!nameTrimmed) {
        return NextResponse.json(
          { error: 'INVALID_NAME', message: 'Service name is required' },
          { status: 400 }
        );
      }

      if (!descTrimmed) {
        return NextResponse.json(
          {
            error: 'INVALID_DESCRIPTION',
            message: 'Service description is required',
          },
          { status: 400 }
        );
      }

      if (duration_minutes == null || duration_minutes < 0) {
        return NextResponse.json(
          {
            error: 'INVALID_DURATION',
            message: 'Duration must be provided and be >= 0',
          },
          { status: 400 }
        );
      }

      if (price == null || price < 0) {
        return NextResponse.json(
          { error: 'INVALID_PRICE', message: 'Price must be >= 0' },
          { status: 400 }
        );
      }

      // Vérifier que la catégorie appartient à ce user
      const catCheck = await sql`
    SELECT id
    FROM service_categories
    WHERE id = ${category_id} AND user_id = ${userId}
    LIMIT 1
  `;
      if (catCheck.length === 0) {
        return NextResponse.json(
          {
            error: 'CATEGORY_NOT_FOUND_OR_FORBIDDEN',
            message: 'Category does not exist for this user',
          },
          { status: 400 }
        );
      }

      const inserted = await sql`
    INSERT INTO services_pricing (
      user_id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport
    )
    VALUES (
      ${userId},
      ${category_id},
      ${nameTrimmed},
      ${descTrimmed},
      ${duration_minutes},
      ${price},
      ${includes_transport ?? false}
    )
    RETURNING
      id,
      user_id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport
  `;

      const categoryRow = await sql`
    SELECT name
    FROM service_categories
    WHERE id = ${inserted[0].category_id}
    LIMIT 1
  `;

      const serviceWithCategoryName = {
        ...inserted[0],
        category_name: categoryRow[0]?.name ?? '',
      };

      return NextResponse.json(
        { ok: true, service: serviceWithCategoryName },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: 'INVALID_KIND', message: 'kind must be category or service' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[POST /api/me/services] error:', err);
    return NextResponse.json(
      { error: 'Failed to create resource', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const guard = await requireInstructor(req);
    if ('error' in guard) {
      const { status, ...rest } = guard;
      return NextResponse.json(rest, { status });
    }
    const { userId } = guard;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const {
      id,
      category_id,
      name,
      description,
      duration_minutes,
      price,
      includes_transport,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: 'Service id is required' },
        { status: 400 }
      );
    }

    const nameTrimmed = typeof name === 'string' ? name.trim() : '';
    const descTrimmed =
      typeof description === 'string' ? description.trim() : '';

    if (!nameTrimmed) {
      return NextResponse.json(
        { error: 'INVALID_NAME', message: 'Service name is required' },
        { status: 400 }
      );
    }

    if (!descTrimmed) {
      return NextResponse.json(
        {
          error: 'INVALID_DESCRIPTION',
          message: 'Service description is required',
        },
        { status: 400 }
      );
    }

    if (duration_minutes == null || duration_minutes < 0) {
      return NextResponse.json(
        {
          error: 'INVALID_DURATION',
          message: 'Duration must be provided and be >= 0',
        },
        { status: 400 }
      );
    }

    if (price == null || price < 0) {
      return NextResponse.json(
        { error: 'INVALID_PRICE', message: 'Price must be >= 0' },
        { status: 400 }
      );
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'INVALID_CATEGORY', message: 'category_id is required' },
        { status: 400 }
      );
    }

    // Vérifier catégorie
    const catCheck = await sql`
  SELECT id
  FROM service_categories
  WHERE id = ${category_id} AND user_id = ${userId}
  LIMIT 1
`;
    if (catCheck.length === 0) {
      return NextResponse.json(
        {
          error: 'CATEGORY_NOT_FOUND_OR_FORBIDDEN',
          message: 'Category does not exist for this user',
        },
        { status: 400 }
      );
    }

    const updated = await sql`
  UPDATE services_pricing
  SET
    category_id = ${category_id},
    name = ${nameTrimmed},
    description = ${descTrimmed},
    duration_minutes = ${duration_minutes},
    price = ${price},
    includes_transport = ${includes_transport}
  WHERE id = ${id} AND user_id = ${userId}
  RETURNING
    id,
    user_id,
    category_id,
    name,
    description,
    duration_minutes,
    price,
    includes_transport
`;

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'SERVICE_NOT_FOUND_OR_FORBIDDEN' },
        { status: 404 }
      );
    }

    const categoryRow = await sql`
      SELECT name
      FROM service_categories
      WHERE id = ${updated[0].category_id}
      LIMIT 1
    `;

    const serviceWithCategoryName = {
      ...updated[0],
      category_name: categoryRow[0]?.name ?? '',
    };

    return NextResponse.json(
      { ok: true, service: serviceWithCategoryName },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[PATCH /api/me/services] error:', err);
    return NextResponse.json(
      { error: 'Failed to update service', detail: err?.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await requireInstructor(req);
    if ('error' in guard) {
      const { status, ...rest } = guard;
      return NextResponse.json(rest, { status });
    }
    const { userId } = guard;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 });
    }

    const { kind, id } = body as { kind?: 'category' | 'service'; id?: number };

    if (!id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: 'id is required' },
        { status: 400 }
      );
    }

    if (kind === 'service') {
      const deleted = await sql`
        DELETE FROM services_pricing
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (deleted.length === 0) {
        return NextResponse.json(
          { error: 'SERVICE_NOT_FOUND_OR_FORBIDDEN' },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (kind === 'category') {
      // Vérifier s'il reste des services dans cette catégorie
      const countRes = await sql`
        SELECT COUNT(*)::int AS cnt
        FROM services_pricing
        WHERE user_id = ${userId} AND category_id = ${id}
      `;
      const count = Number(countRes[0]?.cnt ?? 0);
      if (count > 0) {
        return NextResponse.json(
          {
            error: 'CATEGORY_HAS_SERVICES',
            message:
              'Impossible de supprimer cette catégorie car elle contient encore des services.',
          },
          { status: 400 }
        );
      }

      const deleted = await sql`
        DELETE FROM service_categories
        WHERE id = ${id} AND user_id = ${userId}
        RETURNING id
      `;

      if (deleted.length === 0) {
        return NextResponse.json(
          { error: 'CATEGORY_NOT_FOUND_OR_FORBIDDEN' },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'INVALID_KIND', message: 'kind must be category or service' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[DELETE /api/me/services] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete resource', detail: err?.message },
      { status: 500 }
    );
  }
}
