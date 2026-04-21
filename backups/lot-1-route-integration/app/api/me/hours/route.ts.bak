// app/api/me/hours/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

type Role = 'student' | 'instructor' | 'admin';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request, { treatPendingAsSignedOut: false });
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized (no userId)' },
        { status: 401 }
      );
    }

    // Récupère l’utilisateur app lié à ce Clerk user
    // (adapte si ta table "User" mappe différemment ; ici on suppose "User".id == id applicatif déjà connu)
    const rows = await sql`
      SELECT id, role, planned_minutes AS "plannedMinutes", remaining_minutes AS "remainingMinutes"
      FROM "User"
      WHERE id = ${userId}
      LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json({
        plannedMinutes: null,
        remainingMinutes: null,
        role: null,
      });
    }

    const u = rows[0] as {
      id: string;
      role: Role;
      plannedMinutes: number | null;
      remainingMinutes: number | null;
    };

    if (u.role !== 'student') {
      return NextResponse.json({
        plannedMinutes: null,
        remainingMinutes: null,
        role: u.role,
      });
    }

    return NextResponse.json({
      plannedMinutes:
        typeof u.plannedMinutes === 'number' ? u.plannedMinutes : 0,
      remainingMinutes:
        typeof u.remainingMinutes === 'number' ? u.remainingMinutes : 0,
      role: u.role,
    });
  } catch (e) {
    console.error('[api/me/hours] GET error', e);
    return NextResponse.json(
      { error: 'Failed to load hours' },
      { status: 500 }
    );
  }
}
