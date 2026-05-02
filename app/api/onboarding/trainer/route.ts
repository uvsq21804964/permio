// app/api/onboarding/trainer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { randomBytes, randomUUID } from 'crypto';
import { requireUser } from '@/lib/api/auth-server';
import { mergeWeeklyAvailabilities } from '@/lib/server/domain/time-ranges';

type AvailabilityPayload = {
  dayOfWeek: number; // 0..6
  startTime: string; // HH:mm
  endTime: string; // HH:mm
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
};

const DEFAULT_ORG_ROLE =
  process.env.CLERK_DEFAULT_ORG_ROLE?.trim() || 'org:member';

let ensureTrainerOnboardingSchemaPromise: Promise<void> | null = null;

function rowsOf<T = any>(res: any): T[] {
  if (!res) return [];
  if (Array.isArray(res)) return res as T[];
  if (Array.isArray(res.rows)) return res.rows as T[];
  return [];
}

function makeId(): string {
  if (typeof randomUUID === 'function') return randomUUID();
  return randomBytes(16).toString('hex');
}

function extractHttpStatus(e: any): number | null {
  const cands = [
    e?.status,
    e?.response?.status,
    e?.statusCode,
    e?.cause?.status,
  ];
  for (const s of cands) if (Number.isInteger(s)) return s;
  return null;
}

function formatClerkError(e: any): string {
  // Clerk renvoie souvent { errors: [{ code, message, longMessage, meta }...] } :contentReference[oaicite:3]{index=3}
  const errs = e?.errors;
  if (Array.isArray(errs) && errs.length) {
    const top = errs[0];
    return (
      top?.longMessage ||
      top?.message ||
      `Clerk error: ${top?.code || 'unknown'}`
    );
  }
  return e?.message || 'Clerk error';
}

function normalizeWebsiteUrl(input: string): string | null {
  const s = String(input || '').trim();
  if (!s) return null;
  const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function generateJoinCode(execSql: any): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    const existsRes = await execSql`
      SELECT 1 FROM "Agency" WHERE UPPER(join_code) = ${code} LIMIT 1
    `;
    if (rowsOf(existsRes).length === 0) return code;
  }
  return randomBytes(6).toString('hex').toUpperCase();
}

async function getClerk() {
  // compat versions: parfois clerkClient est un objet, parfois une fonction
  const anyClient: any = clerkClient as any;
  return typeof anyClient === 'function' ? await anyClient() : anyClient;
}

async function ensureTrainerOnboardingSchema() {
  if (!ensureTrainerOnboardingSchemaPromise) {
    ensureTrainerOnboardingSchemaPromise = (async () => {
      await sql`ALTER TABLE IF EXISTS "Agency" ADD COLUMN IF NOT EXISTS join_code text`;
      await sql`ALTER TABLE IF EXISTS "Agency" ADD COLUMN IF NOT EXISTS clerk_org_id text`;
      await sql`ALTER TABLE IF EXISTS "Agency" ADD COLUMN IF NOT EXISTS createdat timestamptz NOT NULL DEFAULT now()`;
      await sql`ALTER TABLE IF EXISTS "Agency" ADD COLUMN IF NOT EXISTS updatedat timestamptz NOT NULL DEFAULT now()`;

      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS "agencyId" text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS formatted_address text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS lat double precision`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS lng double precision`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS street text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS street_number text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS postal_code text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS city text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS country text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS country_code text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS google_place_id text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS raw_input text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS address_label text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS is_primary boolean`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS website_url text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS phone_country_code text`;
      await sql`ALTER TABLE IF EXISTS "User" ADD COLUMN IF NOT EXISTS phone_number text`;
    })().catch((error) => {
      ensureTrainerOnboardingSchemaPromise = null;
      throw error;
    });
  }

  await ensureTrainerOnboardingSchemaPromise;
}

async function createClerkOrganizationStrict(
  clerk: any,
  agencyName: string,
  createdBy: string
) {
  const org = await clerk.organizations.createOrganization({
    name: agencyName,
    createdBy,
  });

  return { clerkOrgId: org.id };
}

async function ensureClerkOrganizationMembership(
  clerk: any,
  organizationId: string,
  userId: string
) {
  try {
    await clerk.organizations.createOrganizationMembership({
      organizationId,
      userId,
      role: DEFAULT_ORG_ROLE,
    });
  } catch (e: any) {
    const status = extractHttpStatus(e);
    const message =
      e?.errors?.[0]?.message ||
      e?.errors?.[0]?.longMessage ||
      e?.message ||
      '';

    const alreadyMember =
      status === 409 ||
      /already.*member/i.test(message) ||
      /membership.*exists/i.test(message);

    const invalidRole =
      status === 400 &&
      (/role/i.test(message) ||
        /invalid.*role/i.test(message) ||
        /does not exist/i.test(message));

    if (invalidRole) {
      const error: any = new Error(
        'Invalid Clerk organization role. Configure CLERK_DEFAULT_ORG_ROLE with a valid role such as "org:member".'
      );
      error.status = 400;
      throw error;
    }

    if (!alreadyMember) {
      throw e;
    }
  }
}

function normalizePhoneCountryCode(input: unknown): string | null {
  const normalized = String(input || '')
    .trim()
    .replace(/\s+/g, '');

  if (!/^\+\d{1,4}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function normalizePhoneNumber(input: unknown): string | null {
  const normalized = String(input || '')
    .trim()
    .replace(/[^\d().\-\s]/g, '')
    .replace(/\s+/g, ' ');

  const digits = normalized.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) {
    return null;
  }

  return normalized;
}

async function updateClerkUserMetadata(
  clerk: any,
  userId: string,
  metadata: { agencyId: string; agencyName: string; clerkOrgId: string }
) {
  try {
    await clerk.users.updateUser(userId, {
      publicMetadata: metadata,
    });
  } catch {
    // Non-blocking: onboarding should still succeed if metadata sync fails.
  }
}

export async function POST(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) return response;
  const { userId } = auth;

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const agencyName = String(body?.agencyName || '').trim();
  const phoneCountryCode = normalizePhoneCountryCode(body?.phoneCountryCode);
  const phoneNumber = normalizePhoneNumber(body?.phoneNumber);
  const websiteUrl = normalizeWebsiteUrl(body?.websiteUrl);

  const address: AddressPayload | null = body?.address ?? null;
  const rawInput: string = String(body?.rawInput || '').trim();

  const availabilities: AvailabilityPayload[] = Array.isArray(
    body?.availabilities
  )
    ? body.availabilities
    : [];

  if (!agencyName) {
    return NextResponse.json(
      { error: 'Invalid agency', details: 'agencyName is required.' },
      { status: 400 }
    );
  }

  if (!websiteUrl) {
    return NextResponse.json(
      {
        error: 'Invalid website',
        details: 'Please enter a valid website URL (e.g. https://example.com).',
      },
      { status: 400 }
    );
  }

  if (!phoneCountryCode || !phoneNumber) {
    return NextResponse.json(
      {
        error: 'Invalid phone',
        details: 'Please provide a valid country calling code and phone number.',
      },
      { status: 400 }
    );
  }

  if (
    !address?.formattedAddress ||
    Number.isNaN(Number(address.lat)) ||
    Number.isNaN(Number(address.lng))
  ) {
    return NextResponse.json(
      {
        error: 'Invalid address',
        details: 'Address with lat/lng is required.',
      },
      { status: 400 }
    );
  }

  if (!availabilities.length) {
    return NextResponse.json(
      {
        error: 'Invalid availabilities',
        details: 'At least one availability is required.',
      },
      { status: 400 }
    );
  }

  const merged = mergeWeeklyAvailabilities(availabilities);
  if (merged.length === 0) {
    return NextResponse.json(
      {
        error: 'Invalid availabilities',
        details: 'No valid availability ranges.',
      },
      { status: 400 }
    );
  }

  let step = 'ensuring schema';
  let clerk: any;
  let displayName = 'User';

  try {
    await ensureTrainerOnboardingSchema();

    step = 'loading Clerk user';
    clerk = await getClerk();
    const clerkUser = await clerk.users.getUser(userId);

    displayName =
      [clerkUser?.firstName, clerkUser?.lastName]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      clerkUser?.username ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      'User';
  } catch (e: any) {
    const st = extractHttpStatus(e);
    const status = st && st >= 400 && st <= 599 ? st : 500;
    console.error('[onboarding/trainer] failed during step:', step, e);
    const details =
      e?.errors || e?.message
        ? `${step}: ${formatClerkError(e)}`
        : `${step}: Unknown error`;

    return NextResponse.json(
      { error: 'Onboarding failed', details },
      { status }
    );
  }

  const dbAny: any = sql as any;

  const run = async (execSql: any) => {
    // 0) Find agency by name
    step = 'looking up agency';
    const existingRes = await execSql`
      SELECT id, join_code, clerk_org_id
      FROM "Agency"
      WHERE LOWER(name) = LOWER(${agencyName})
      LIMIT 1
    `;
    const existing = rowsOf<{
      id: string;
      join_code: string;
      clerk_org_id: string | null;
    }>(existingRes);

    let agencyId: string | null = existing[0]?.id ?? null;
    let joinCode: string | null = existing[0]?.join_code ?? null;
    let clerkOrgId: string | null = existing[0]?.clerk_org_id ?? null;

    // ✅ si l'agence existe mais n'a pas d'org Clerk -> on la crée (STRICT)
    if (agencyId && !clerkOrgId) {
      step = 'creating Clerk organization for existing agency';
      const org = await createClerkOrganizationStrict(
        clerk,
        agencyName,
        userId
      );
      clerkOrgId = org.clerkOrgId;

      await execSql`
        UPDATE "Agency"
        SET clerk_org_id = ${clerkOrgId}
        WHERE id = ${agencyId}
      `;
    }

    // ✅ création complète (STRICT)
    if (!agencyId) {
      step = 'creating agency';
      joinCode = await generateJoinCode(execSql);
      agencyId = makeId();

      const org = await createClerkOrganizationStrict(
        clerk,
        agencyName,
        userId
      );
      clerkOrgId = org.clerkOrgId;

      const createdRes = await execSql`
        INSERT INTO "Agency" (
          id,
          name,
          join_code,
          clerk_org_id,
          createdat,
          updatedat
        ) VALUES (
          ${agencyId},
          ${agencyName},
          ${joinCode},
          ${clerkOrgId},
          NOW(),
          NOW()
        )
        RETURNING id, join_code, clerk_org_id
      `;
      const created = rowsOf<{
        id: string;
        join_code: string;
        clerk_org_id: string;
      }>(createdRes);
      agencyId = created[0]?.id ?? agencyId;
      joinCode = created[0]?.join_code ?? joinCode;
      clerkOrgId = created[0]?.clerk_org_id ?? clerkOrgId;
    }

    if (!agencyId || !clerkOrgId) {
      // en strict: impossible
      const err: any = new Error('Agency/Clerk organization creation failed.');
      err.status = 500;
      throw err;
    }

    step = 'ensuring Clerk organization membership';
    await ensureClerkOrganizationMembership(clerk, clerkOrgId, userId);

    // RLS context
    step = 'setting agency context';
    await execSql`SELECT set_config('app.agency_id', ${agencyId}, true)`;

    // 1) Upsert User
    step = 'upserting user';
    await execSql`
      INSERT INTO "User" (
        id,
        name,
        role,
        "agencyId",
        "createdAt",
        "updatedAt",
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
        is_primary,
        website_url,
        phone_country_code,
        phone_number
      ) VALUES (
        ${userId},
        ${displayName},
        ${'instructor'},
        ${agencyId},
        NOW(),
        NOW(),
        ${address.formattedAddress},
        ${Number(address.lat)},
        ${Number(address.lng)},
        ${address.street ?? null},
        ${address.streetNumber ?? null},
        ${address.postalCode ?? null},
        ${address.city ?? null},
        ${address.country ?? null},
        ${address.countryCode ?? null},
        ${address.googlePlaceId ?? null},
        ${rawInput || null},
        ${true},
        ${websiteUrl},
        ${phoneCountryCode},
        ${phoneNumber}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        "agencyId" = EXCLUDED."agencyId",
        "updatedAt" = NOW(),
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
        is_primary = EXCLUDED.is_primary,
        website_url = EXCLUDED.website_url,
        phone_country_code = EXCLUDED.phone_country_code,
        phone_number = EXCLUDED.phone_number
    `;

    // 2) Replace Availability (id required)
    step = 'replacing availabilities';
    await execSql`DELETE FROM "Availability" WHERE "userId" = ${userId}`;

    for (const a of merged) {
      step = 'inserting availability';
      const availabilityId = makeId();
      await execSql`
        INSERT INTO "Availability" (
          id,
          "userId",
          "dayOfWeek",
          "startTime",
          "endTime",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${availabilityId},
          ${userId},
          ${a.dayOfWeek},
          ${a.startTime},
          ${a.endTime},
          NOW(),
          NOW()
        )
      `;
    }

    step = 'updating Clerk user metadata';
    await updateClerkUserMetadata(clerk, userId, {
      agencyId,
      agencyName,
      clerkOrgId,
    });

    return { agencyId, joinCode, clerkOrgId };
  };

  try {
    const result =
      typeof dbAny?.begin === 'function'
        ? await dbAny.begin(async (tx: any) => run(tx))
        : await run(sql);

    return NextResponse.json({
      ok: true,
      count: merged.length,
      agencyId: result.agencyId,
      joinCode: result.joinCode,
      clerkOrgId: result.clerkOrgId,
      organizationId: result.clerkOrgId, // ✅ AJOUT
    });
  } catch (e: any) {
    const st = extractHttpStatus(e);
    const status = st && st >= 400 && st <= 599 ? st : 500;

    // si c’est Clerk qui bloque, on renvoie un message exploitable
    const details =
      e?.errors || e?.message
        ? `${step}: ${formatClerkError(e)}`
        : `${step}: Unknown error`;

    return NextResponse.json(
      { error: 'Onboarding failed', details },
      { status }
    );
  }
}
