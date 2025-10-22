// app/api/availability/confirm-week/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

function isMondayISO(iso: string) {
  return sql`SELECT (EXTRACT(ISODOW FROM ${iso}::date)::int = 1) AS ok`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const weekStart: string | undefined = body?.weekStart;
    if (!weekStart) {
      return NextResponse.json(
        { error: 'weekStart is required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Vérifier que c'est un lundi
    const [{ ok }] = await isMondayISO(weekStart);
    if (!ok) {
      return NextResponse.json(
        { error: 'weekStart must be a Monday (ISO)' },
        { status: 400 }
      );
    }

    // (Optionnel) s’assurer qu’il a au moins une dispo paramétrée
    const avail = await sql`
      SELECT 1
      FROM "Availability"
      WHERE "userId" = ${userId}
      LIMIT 1
    `;
    if (avail.length === 0) {
      return NextResponse.json(
        {
          error:
            'Aucune disponibilité trouvée. Ajoutez au moins une plage avant de valider.',
        },
        { status: 400 }
      );
    }

    // Enregistrer la validation
    await sql`
      UPDATE "User"
      SET "last_validated_week_start" = ${weekStart}::date,
          "last_validated_at" = NOW(),
          "updatedAt" = NOW()
      WHERE id = ${userId}
    `;

    return NextResponse.json({ ok: true, weekStart });
  } catch (err: any) {
    console.error('[confirm-week] error:', err);
    return NextResponse.json(
      { error: 'Failed to confirm week', detail: err?.message },
      { status: 500 }
    );
  }
}
