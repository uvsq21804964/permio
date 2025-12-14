// app/api/onboarding/trainer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkClient, getAuth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { randomBytes, randomUUID } from 'crypto';

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

const START_MIN = 8 * 60;
const END_MAX = 20 * 60;

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

function timeToMinutes(time: string): number {
  if (!/^\d{2}:\d{2}$/.test(time)) return NaN;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

function minutesToTime(m: number) {
  const hh = Math.floor(m / 60)
    .toString()
    .padStart(2, '0');
  const mm = (m % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function mergeAvailabilities(
  list: AvailabilityPayload[]
): AvailabilityPayload[] {
  const byDay = new Map<number, { s: number; e: number }[]>();

  for (const a of list) {
    const day = Number(a?.dayOfWeek);
    const s = timeToMinutes(String(a?.startTime || ''));
    const e = timeToMinutes(String(a?.endTime || ''));
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    if (e <= s) continue;
    byDay.set(day, [...(byDay.get(day) ?? []), { s, e }]);
  }

  const out: AvailabilityPayload[] = [];
  for (const [day, ranges] of byDay.entries()) {
    const sorted = [...ranges].sort((a, b) => a.s - b.s || a.e - b.e);
    const merged: { s: number; e: number }[] = [];

    for (const r of sorted) {
      if (merged.length === 0) merged.push({ ...r });
      else {
        const last = merged[merged.length - 1];
        if (r.s <= last.e) last.e = Math.max(last.e, r.e);
        else merged.push({ ...r });
      }
    }

    for (const r of merged) {
      out.push({
        dayOfWeek: day,
        startTime: minutesToTime(r.s),
        endTime: minutesToTime(r.e),
      });
    }
  }

  return out.sort(
    (a, b) =>
      a.dayOfWeek - b.dayOfWeek ||
      timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
  );
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

export async function POST(req: NextRequest) {
  const { userId } = getAuth(req, { treatPendingAsSignedOut: false });
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const agencyName = String(body?.agencyName || '').trim();
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

  const cleaned: AvailabilityPayload[] = [];
  for (const a of availabilities) {
    const day = Number(a?.dayOfWeek);
    const s = timeToMinutes(String(a?.startTime || ''));
    const e = timeToMinutes(String(a?.endTime || ''));

    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    if (Number.isNaN(s) || Number.isNaN(e)) continue;
    if (e <= s) continue;
    if (s < START_MIN || e > END_MAX) continue;

    cleaned.push({
      dayOfWeek: day,
      startTime: minutesToTime(s),
      endTime: minutesToTime(e),
    });
  }

  const merged = mergeAvailabilities(cleaned);
  if (merged.length === 0) {
    return NextResponse.json(
      {
        error: 'Invalid availabilities',
        details: 'No valid availability ranges.',
      },
      { status: 400 }
    );
  }

  const clerk = await getClerk();
  const clerkUser = await clerk.users.getUser(userId);

  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    clerkUser?.username ||
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    'User';

  const dbAny: any = sql as any;

  const run = async (execSql: any) => {
    // 0) Find agency by name
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

    // RLS context
    await execSql`SELECT set_config('app.agency_id', ${agencyId}, true)`;

    // 1) Upsert User
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
        website_url
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
        ${websiteUrl}
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
        website_url = EXCLUDED.website_url
    `;

    // 2) Replace Availability (id required)
    await execSql`DELETE FROM "Availability" WHERE "userId" = ${userId}`;

    for (const a of merged) {
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
        ? formatClerkError(e)
        : e?.message || 'Unknown error';

    return NextResponse.json(
      { error: 'Onboarding failed', details },
      { status }
    );
  }
}
