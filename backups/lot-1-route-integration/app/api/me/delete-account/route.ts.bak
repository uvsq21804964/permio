// app/api/me/delete-account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

export async function DELETE(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1) Supprimer dans ta BDD (adapte nom de table & colonne)
    await sql`
      DELETE FROM "User"
      WHERE id = ${userId}
    `;

    // 2) Récupérer le client Clerk, puis supprimer l'utilisateur
    const clerk = await clerkClient(); // 👈 important
    await clerk.users.deleteUser(userId);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting account', error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          'Erreur lors de la suppression du compte utilisateur côté serveur.',
      },
      { status: 500 }
    );
  }
}
