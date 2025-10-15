// app/api/agency/association/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

type AgencyRow = {
  id: string;
  name: string;
  clerk_org_id: string | null;
  join_code: string;
};

// Rôle par défaut pour la membership (adapter si tu utilises des rôles custom)
const DEFAULT_ORG_ROLE =
  process.env.CLERK_DEFAULT_ORG_ROLE?.trim() || 'org:member';

export async function POST(req: NextRequest) {
  // 1) Auth Clerk → récupère l'user_id
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2) Body → code agence (normalisé)
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const normalized = String(body?.code || '')
    .trim()
    .toUpperCase();
  if (!normalized) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  // 3) Lookup agence par code → récupère organization_id
  let agency: AgencyRow | undefined;
  try {
    const rows: AgencyRow[] = await sql/* sql */ `
      SELECT id, name, clerk_org_id, join_code
      FROM "Agency"
      WHERE UPPER(join_code) = ${normalized}
      LIMIT 1
    `;
    agency = rows?.[0];
  } catch {
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!agency?.clerk_org_id) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
  }

  const organizationId = agency.clerk_org_id;

  const clerk = await clerkClient();

  // 4) Crée (idempotent) la membership user ↔ organization
  try {
    await clerk.organizations.createOrganizationMembership({
      organizationId,
      userId,
      role: DEFAULT_ORG_ROLE, // ex: 'org:member'
    });
  } catch (e: any) {
    const status = e?.status || e?.statusCode;
    const msg =
      e?.errors?.[0]?.message || e?.message || (typeof e === 'string' ? e : '');

    const alreadyMember =
      status === 409 ||
      /already.*member/i.test(msg) ||
      /membership.*exists/i.test(msg);

    if (!alreadyMember) {
      // remonte l’erreur Clerk pour faciliter le debug (role invalide, org not found, etc.)
      return NextResponse.json(
        { error: 'Join failed', details: msg || 'unknown' },
        { status: 400 }
      );
    }
    // sinon, on considère que c’est OK (idempotent)
  }

  // 5) (Optionnel) enrichit le profil Clerk (non bloquant)
  try {
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        agencyId: agency.id,
        agencyName: agency.name,
        clerkOrgId: organizationId,
      },
    });
  } catch {
    // ignorer les erreurs metadata
  }

  // 5bis) Upsert automatique du user applicatif dans Neon → table "User"
  //       - on utilise l'id Clerk comme id de "User"
  //       - name : dérivé du profil Clerk
  //       - role : 'member' par défaut (adapte à 'student'/'instructor' si tu préfères)
  try {
    const clerkUser = await clerk.users.getUser(userId);
    const displayName =
      [clerkUser?.firstName, clerkUser?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      clerkUser?.username ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      'Utilisateur';

    const appRole = 'student'; // <-- change en 'student' ou 'instructor' si besoin

    // IMPORTANT : colonnes sensibles à la casse → quote "createdAt"/"updatedAt"/"agencyId"
    await sql/* sql */ `
      INSERT INTO "User" (id, name, role, "createdAt", "updatedAt", "agencyId")
      VALUES (
        ${userId},
        ${displayName},
        ${appRole},
        NOW(),
        NOW(),
        ${agency.id}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = COALESCE("User".role, EXCLUDED.role),
        "agencyId" = EXCLUDED."agencyId",
        "updatedAt" = NOW()
    `;
  } catch (e: any) {
    // Si l'upsert échoue, on log mais on n'empêche pas la réponse (à toi de décider)
    console.error('Upsert "User" failed:', e?.message || e);
    // Tu peux décommenter pour rendre bloquant :
    // return NextResponse.json({ error: 'User upsert failed' }, { status: 500 });
  }

  // 6) Réponse : renvoie explicitement user_id et organization_id
  return NextResponse.json({
    ok: true,
    userId,
    organizationId,
    agencyId: agency.id,
    agencyName: agency.name,
  });
}
