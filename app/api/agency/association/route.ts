// app/api/agency/association/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { inngest } from '@/src/lib/inngest/client';
import { requireUser } from '@/lib/api/auth-server';

type AgencyRow = {
  id: string;
  name: string;
  clerk_org_id: string | null;
  join_code: string;
};

type AddressPayload = {
  formattedAddress: string;
  lat: number;
  lng: number;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  googlePlaceId?: string;
  rawInput?: string;
};

// Utilise un rôle d'org Clerk valide (ex: 'org:member', 'org:admin', ou un slug existant)
const DEFAULT_ORG_ROLE =
  process.env.CLERK_DEFAULT_ORG_ROLE?.trim() || 'org:member';

export async function POST(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) return response;
  const { userId } = auth;

  const clerk = await clerkClient();

  // Parse body
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // no-op, on gère plus bas
  }
  const locale =
    typeof body?.locale === 'string' && body.locale.trim()
      ? body.locale.trim()
      : 'fr';

  // 1) Validation du code agence
  const normalized = String(body?.code || '')
    .trim()
    .toUpperCase();
  if (!normalized) {
    return NextResponse.json(
      { error: 'Missing code', details: 'Le code agence est obligatoire.' },
      { status: 400 },
    );
  }

  // 2) Validation de l'adresse
  const rawAddress = body?.address;
  let address: AddressPayload | null = null;

  if (!rawAddress) {
    return NextResponse.json(
      {
        error: 'Missing address',
        details:
          'Une adresse normalisée (provenant des suggestions Google) est obligatoire.',
      },
      { status: 400 },
    );
  }

  try {
    const formattedAddress = String(rawAddress.formattedAddress || '').trim();
    const lat = Number(rawAddress.lat);
    const lng = Number(rawAddress.lng);

    if (!formattedAddress || Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        {
          error: 'Invalid address',
          details:
            "L'adresse fournie est incomplète ou ne contient pas de coordonnées valides.",
        },
        { status: 400 },
      );
    }

    address = {
      formattedAddress,
      lat,
      lng,
      street: rawAddress.street ? String(rawAddress.street) : undefined,
      streetNumber: rawAddress.streetNumber
        ? String(rawAddress.streetNumber)
        : undefined,
      postalCode: rawAddress.postalCode
        ? String(rawAddress.postalCode)
        : undefined,
      city: rawAddress.city ? String(rawAddress.city) : undefined,
      country: rawAddress.country ? String(rawAddress.country) : undefined,
      countryCode: rawAddress.countryCode
        ? String(rawAddress.countryCode)
        : undefined,
      googlePlaceId: rawAddress.googlePlaceId
        ? String(rawAddress.googlePlaceId)
        : undefined,
      rawInput: rawAddress.rawInput ? String(rawAddress.rawInput) : undefined,
    };
  } catch (e) {
    console.error('Address parse error:', e);
    return NextResponse.json(
      {
        error: 'Invalid address',
        details:
          "Impossible d'interpréter l'adresse fournie. Merci de sélectionner une suggestion Google.",
      },
      { status: 400 },
    );
  }

  // 3) Lookup agence
  let agency: AgencyRow | undefined;
  try {
    const rows = await sql /* sql */ `
      SELECT id, name, clerk_org_id, join_code
      FROM "Agency"
      WHERE UPPER(join_code) = ${normalized}
      LIMIT 1
    `;
    agency = rows?.[0] as AgencyRow | undefined;
  } catch (e) {
    console.error('DB error:', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!agency?.clerk_org_id) {
    return NextResponse.json(
      {
        error: 'Code invalide',
        details: 'Aucune agence trouvée pour ce code.',
      },
      { status: 404 },
    );
  }

  const organizationId = agency.clerk_org_id;

  // 4) Création idempotente de la membership Clerk
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

    const roleInvalid =
      status === 400 &&
      (/role/i.test(msg) ||
        /invalid.*role/i.test(msg) ||
        /does not exist/i.test(msg));

    if (roleInvalid) {
      return NextResponse.json(
        {
          error: 'Invalid organization role',
          details:
            'Le rôle fourni pour la membership Clerk est invalide. Utilisez par exemple "org:member" ou configurez CLERK_DEFAULT_ORG_ROLE.',
        },
        { status: 400 },
      );
    }

    if (!alreadyMember) {
      return NextResponse.json(
        { error: 'Join failed', details: msg || 'unknown' },
        { status: 400 },
      );
    }
    // sinon on continue (idempotent)
  }

  // 5) Enrichit le profil Clerk (non bloquant)
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

  // 6) Upsert dans ta table "User" + enregistrement de l'adresse
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

    // Adresse principale : on considère que l'adresse fournie à l'onboarding
    // est l'adresse principale de départ de l'utilisateur.
    const addr = address!;

    await sql /* sql */ `
      INSERT INTO "User" (
        id,
        name,
        role,
        "createdAt",
        "updatedAt",
        "agencyId",
        formatted_address,
        lat,
        lng,
        street,
        street_number,
        postal_code,
        city,
        country,
        country_code,
        google_place_id,
        raw_input,
        address_label,
        is_primary
      )
      VALUES (
        ${userId},
        ${displayName},
        ${appRole},
        NOW(),
        NOW(),
        ${agency.id},
        ${addr.formattedAddress},
        ${addr.lat},
        ${addr.lng},
        ${addr.street || null},
        ${addr.streetNumber || null},
        ${addr.postalCode || null},
        ${addr.city || null},
        ${addr.country || null},
        ${addr.countryCode || null},
        ${addr.googlePlaceId || null},
        ${addr.rawInput || null},
        ${'Adresse principale'},
        ${true}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        role = COALESCE("User".role, EXCLUDED.role),
        "agencyId" = EXCLUDED."agencyId",
        formatted_address = EXCLUDED.formatted_address,
        lat = EXCLUDED.lat,
        lng = EXCLUDED.lng,
        street = EXCLUDED.street,
        street_number = EXCLUDED.street_number,
        postal_code = EXCLUDED.postal_code,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        country_code = EXCLUDED.country_code,
        google_place_id = EXCLUDED.google_place_id,
        raw_input = EXCLUDED.raw_input,
        address_label = COALESCE("User".address_label, EXCLUDED.address_label),
        is_primary = COALESCE("User".is_primary, EXCLUDED.is_primary),
        "updatedAt" = NOW()
    `;
  } catch (e: any) {
    console.error('Upsert "User" failed:', e?.message || e);
    // à toi de décider si tu veux rendre ça bloquant
  }

  // 7) Emit event for email notifications
  const eventPayload = {
    id: `agency:${agency.id}:member:${userId}`,
    name: 'agency/member-joined',
    data: {
      agencyId: agency.id,
      agencyName: agency.name,
      organizationId,
      userId,
      locale,
    },
  };
  console.info('[agency/association] emit event Instructor', eventPayload);
  await inngest.send(eventPayload);

  // 8) Emit event for client welcome email
  const eventPayloadClient = {
    id: `agency:${agency.id}:client-welcome:${userId}`,
    name: 'agency/client-welcome',
    data: {
      agencyId: agency.id,
      agencyName: agency.name,
      organizationId,
      userId,
      locale,
    },
  };

  console.info('[agency/association] emit event Client', eventPayloadClient);
  await inngest.send(eventPayloadClient);

  return NextResponse.json({
    ok: true,
    userId,
    organizationId,
    agencyId: agency.id,
    agencyName: agency.name,
  });
}
