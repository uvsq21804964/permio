import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await sql`
      SELECT id FROM "Availability" WHERE id = ${id}
    `;

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Availability not found' },
        { status: 404 }
      );
    }

    await sql`DELETE FROM "Availability" WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Error deleting availability:', error);
    return NextResponse.json(
      { error: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}
