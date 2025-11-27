import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

type MeRow = {
  id: string;
  role: string;
  agencyId: string;
};

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
  price: string; // NUMERIC => string côté node
  includes_transport: boolean;
};

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1) On récupère l'utilisateur courant pour connaître son agence + rôle
    const [me] = await sql`
      SELECT id, role, "agencyId"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (!me) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    // 2) On détermine le moniteur de l'agence
    let instructorId = me.id;

    if (me.role !== 'instructor') {
      const [instructor] = await sql`
        SELECT id
        FROM "User"
        WHERE "agencyId" = ${me.agencyId}
          AND role = 'instructor'
        LIMIT 1
      `;

      if (!instructor) {
        return NextResponse.json(
          { error: 'INSTRUCTOR_NOT_FOUND_FOR_AGENCY' },
          { status: 404 }
        );
      }
      instructorId = instructor.id;
    }

    // 3) Catégories du moniteur
    const categories = await sql`
      SELECT id, user_id, name, description
      FROM service_categories
      WHERE user_id = ${instructorId}
      ORDER BY name
    `;

    // 4) Services du moniteur (avec le nom de la catégorie)
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
      WHERE s.user_id = ${instructorId}
      ORDER BY c.name, s.name
    `;

    return NextResponse.json(
      {
        instructorId,
        categories,
        services,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[GET /api/me/instructor-services] error:', err);
    return NextResponse.json(
      {
        error: 'Failed to fetch instructor services',
        detail: err?.message,
      },
      { status: 500 }
    );
  }
}
