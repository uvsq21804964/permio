// app/api/plan/free/route.ts
import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db'; // ta connexion Neon

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await sql.query(
    `INSERT INTO subscriptions (user_id, status)
     VALUES ($1, 'free')
     ON CONFLICT (user_id) DO UPDATE SET status='free'`,
    [userId]
  );

  return NextResponse.json({ ok: true });
}
