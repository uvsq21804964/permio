// app/api/me/services/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import {
  createCategoryForInstructor,
  createServiceForInstructor,
  deleteCategoryForInstructor,
  deleteServiceForInstructor,
  ensureCategoryBelongsToUser,
  getOwnInstructorServiceCatalog,
  requireInstructorUser,
  updateServiceForInstructor,
  validateCategoryPayload,
  validateServicePayload,
} from '@/lib/server/services/service-catalog-service';

async function requireInstructor(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) {
    return { error: 'Unauthorized', status: response.status } as const;
  }

  const guard = await requireInstructorUser(auth.userId);
  if (!guard.ok) {
    return { status: guard.status, ...guard.body } as const;
  }

  return { userId: auth.userId } as const;
}

export async function GET(req: NextRequest) {
  try {
    const guard = await requireInstructor(req);
    if ('error' in guard) {
      const { status, ...rest } = guard;
      return NextResponse.json(rest, { status });
    }
    const { userId } = guard;

    const { categories, services, joinCode, agencyName } =
      await getOwnInstructorServiceCatalog(userId);

    return NextResponse.json(
      { categories, services, joinCode, agencyName },
      { status: 200 }
    );
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
      const validation = validateCategoryPayload(body);
      if (!validation.ok) {
        return NextResponse.json(validation.body, { status: validation.status });
      }

      const inserted = await createCategoryForInstructor({
        userId,
        name: validation.value.name,
        description: validation.value.description,
      });

      return NextResponse.json(
        { ok: true, category: inserted },
        { status: 201 }
      );
    }

    if (kind === 'service') {
      const validation = validateServicePayload(body);
      if (!validation.ok) {
        return NextResponse.json(validation.body, { status: validation.status });
      }

      const categoryCheck = await ensureCategoryBelongsToUser(
        validation.value.categoryId,
        userId
      );
      if (!categoryCheck.ok) {
        return NextResponse.json(categoryCheck.body, {
          status: categoryCheck.status,
        });
      }

      const serviceWithCategoryName = await createServiceForInstructor({
        userId,
        categoryId: validation.value.categoryId,
        name: validation.value.name,
        description: validation.value.description,
        durationMinutes: validation.value.durationMinutes,
        price: validation.value.price,
        includesTransport: validation.value.includesTransport ?? false,
        isRemote: validation.value.isRemote,
      });

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

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: 'Service id is required' },
        { status: 400 }
      );
    }

    const validation = validateServicePayload(body);
    if (!validation.ok) {
      return NextResponse.json(validation.body, { status: validation.status });
    }

    const categoryCheck = await ensureCategoryBelongsToUser(
      validation.value.categoryId,
      userId
    );
    if (!categoryCheck.ok) {
      return NextResponse.json(categoryCheck.body, {
        status: categoryCheck.status,
      });
    }

    const updated = await updateServiceForInstructor({
      serviceId: Number(id),
      userId,
      categoryId: validation.value.categoryId,
      name: validation.value.name,
      description: validation.value.description,
      durationMinutes: validation.value.durationMinutes,
      price: validation.value.price,
      includesTransport: validation.value.includesTransport,
      isRemote: validation.value.isRemote,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'SERVICE_NOT_FOUND_OR_FORBIDDEN' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, service: updated }, { status: 200 });
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
      const deleted = await deleteServiceForInstructor(id, userId);

      if (!deleted) {
        return NextResponse.json(
          { error: 'SERVICE_NOT_FOUND_OR_FORBIDDEN' },
          { status: 404 }
        );
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (kind === 'category') {
      const result = await deleteCategoryForInstructor(id, userId);
      if (!result.ok) {
        return NextResponse.json(result.body, { status: result.status });
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
