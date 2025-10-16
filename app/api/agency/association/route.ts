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

// Utilise un rôle d'org Clerk valide (ex: 'org:member', 'org:admin', ou un slug existant)
const DEFAULT_ORG_ROLE =
  process.env.CLERK_DEFAULT_ORG_ROLE?.trim() || 'org:member';

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clerk = await clerkClient();

  // Parse body
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

  // Lookup agence
  let agency;
  try {
    const rows = await sql/* sql */ `
      SELECT id, name, clerk_org_id, join_code
      FROM "Agency"
      WHERE UPPER(join_code) = ${normalized}
      LIMIT 1
    `;
    agency = rows?.[0];
  } catch (e) {
    console.error('DB error:', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!agency?.clerk_org_id) {
    return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
  }

  const organizationId = agency.clerk_org_id;

  // 1) Création idempotente de la membership
  try {
    await clerk.organizations.createOrganizationMembership({
      organizationId,
      userId,
      role: DEFAULT_ORG_ROLE, // ⚠️ rôle valide côté Clerk
    });
  } catch (e: any) {
    const status = e?.status || e?.statusCode;
    const msg =
      e?.errors?.[0]?.message || e?.message || (typeof e === 'string' ? e : '');

    const alreadyMember =
      status === 409 ||
      /already.*member/i.test(msg) ||
      /membership.*exists/i.test(msg);

    // Si le rôle est invalide, Clerk renvoie 400
    const roleInvalid =
      status === 400 &&
      (/role/i.test(msg) ||
        /invalid.*role/i.test(msg) ||
        /does not exist/i.test(msg));

    if (roleInvalid) {
      return NextResponse.json(
        {
          error: 'Invalid organization role',
          details: `Use a Clerk org role like "org:member" or set CLERK_DEFAULT_ORG_ROLE.`,
        },
        { status: 400 }
      );
    }

    if (!alreadyMember) {
      // Autres cas: org inexistante, restrictions, etc.
      return NextResponse.json(
        { error: 'Join failed', details: msg || 'unknown' },
        { status: 400 }
      );
    }
    // sinon on continue (idempotent)
  }

  // 2) Enrichit le profil (non bloquant)
  try {
    await clerk.users.updateUser(userId, {
      publicMetadata: {
        agencyId: agency.id,
        agencyName: agency.name,
        clerkOrgId: organizationId,
      },
    });
  } catch (e) {
    console.warn('Metadata update skipped:', e);
  }

  // 3) Upsert dans ta table "User"
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

    // Rôle applicatif : sans rapport avec le rôle d’org Clerk !
    const appRole = 'student'; // adapte si besoin

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
    console.error('Upsert "User" failed:', e?.message || e);
    // à toi de décider si tu veux rendre bloquant
  }

  return NextResponse.json({
    ok: true,
    userId,
    organizationId,
    agencyId: agency.id,
    agencyName: agency.name,
  });
}
