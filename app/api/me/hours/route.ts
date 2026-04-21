// app/api/me/hours/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { requireUser } from '@/lib/api/auth-server';
import { getStudentHours } from '@/lib/server/repositories/user-repository';

type Role = 'student' | 'instructor' | 'admin';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { auth, response } = requireUser(request, {
      treatPendingAsSignedOut: false,
    });
    if (!auth) return response;
    const { userId } = auth;

    // Récupère l’utilisateur app lié à ce Clerk user
    // (adapte si ta table "User" mappe différemment ; ici on suppose "User".id == id applicatif déjà connu)
    const u = await getStudentHours(userId);
    if (!u) {
      return NextResponse.json({
        plannedMinutes: null,
        remainingMinutes: null,
        role: null,
      });
    }

    if (u.role !== 'student') {
      return NextResponse.json({
        plannedMinutes: null,
        remainingMinutes: null,
        role: u.role,
      });
    }

    return NextResponse.json({
      plannedMinutes:
        typeof u.planned_minutes === 'number' ? u.planned_minutes : 0,
      remainingMinutes:
        typeof u.remaining_minutes === 'number' ? u.remaining_minutes : 0,
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
