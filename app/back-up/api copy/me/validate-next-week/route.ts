import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

// Lundi prochain (S+1) en ISO (YYYY-MM-DD)
function nextMondayISO(base = new Date()): string {
  const now = new Date(base);
  const dow = now.getDay(); // 0..6 (0=Dim)
  const isoDow = dow === 0 ? 7 : dow; // 1..7
  const delta = (8 - isoDow) % 7 || 7; // jours à ajouter
  const d = new Date(now);
  d.setDate(now.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optionnel : guard côté serveur avec la valeur attendue envoyée par le client
    let expectedWeekStart: string | undefined;
    try {
      const body = await req.json().catch(() => null);
      expectedWeekStart = body?.expectedWeekStart;
    } catch {
      /* ignore */
    }

    const weekStart = nextMondayISO();

    if (expectedWeekStart && expectedWeekStart !== weekStart) {
      return NextResponse.json(
        { error: 'WEEK_MISMATCH', weekStartServer: weekStart },
        { status: 409 }
      );
    }

    // Vérifier qu’il existe au moins une disponibilité
    const hasAny = await sql`
      SELECT 1 FROM "Availability" WHERE "userId" = ${userId} LIMIT 1
    `;
    if (hasAny.length === 0) {
      return NextResponse.json({ error: 'NO_AVAILABILITIES' }, { status: 400 });
    }

    // ==> Mise à jour de la semaine validée
    const updated = await sql`
      UPDATE "User"
      SET
        "last_validated_week_start" = ${weekStart}::date,
        "last_validated_at" = NOW(),
        "updatedAt" = NOW()
      WHERE "id" = ${userId}
      RETURNING "id", "last_validated_week_start", "last_validated_at"
    `;

    if (updated.length === 0) {
      // (cas improbable si l'ID n'existe pas)
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        weekStart,
        lastValidatedWeekStart: updated[0].last_validated_week_start,
        lastValidatedAt: updated[0].last_validated_at,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[POST /api/me/validate-next-week] error:', err);
    return NextResponse.json(
      { error: 'Failed to validate next week', detail: err?.message },
      { status: 500 }
    );
  }
}
