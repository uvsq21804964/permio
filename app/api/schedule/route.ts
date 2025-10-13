// app/api/schedule/route.ts
import { NextResponse } from 'next/server';
import { runPythonScheduler } from '@/lib/scheduler';

export async function POST() {
  try {
    const result = await runPythonScheduler();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[schedule] error:', err);
    return NextResponse.json(
      {
        error: 'Erreur lors de la génération du planning',
        details: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}
