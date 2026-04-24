import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

import { requireUser } from '@/lib/api/auth-server';
import { getAgencyByJoinCode } from '@/lib/server/repositories/agency-repository';
import { getFirstAgencyInstructor } from '@/lib/server/repositories/user-repository';

function buildTrainerDisplayName(params: {
  fallbackName: string | null | undefined;
  clerkUser:
    | {
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        emailAddresses?: Array<{ emailAddress?: string | null }>;
      }
    | null;
}) {
  const fallbackName = params.fallbackName?.trim();
  if (fallbackName) {
    return fallbackName;
  }

  const clerkName = [
    params.clerkUser?.firstName?.trim(),
    params.clerkUser?.lastName?.trim(),
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (clerkName) {
    return clerkName;
  }

  const username = params.clerkUser?.username?.trim();
  if (username) {
    return username;
  }

  const primaryEmail = params.clerkUser?.emailAddresses?.[0]?.emailAddress?.trim();
  return primaryEmail || null;
}

export async function GET(req: NextRequest) {
  const { auth, response } = requireUser(req, {
    treatPendingAsSignedOut: false,
  });
  if (!auth) {
    return response;
  }

  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase() ?? '';
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const agency = await getAgencyByJoinCode(code);
  if (!agency) {
    return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
  }

  const instructor = await getFirstAgencyInstructor(agency.id);
  if (!instructor) {
    return NextResponse.json({
      agency: {
        id: agency.id,
        name: agency.name,
      },
      trainer: null,
    });
  }

  let clerkUser:
    | {
        firstName?: string | null;
        lastName?: string | null;
        username?: string | null;
        imageUrl?: string | null;
        emailAddresses?: Array<{ emailAddress?: string | null }>;
      }
    | null = null;

  try {
    const clerk = await clerkClient();
    clerkUser = await clerk.users.getUser(instructor.id);
  } catch {
    clerkUser = null;
  }

  return NextResponse.json({
    agency: {
      id: agency.id,
      name: agency.name,
    },
    trainer: {
      id: instructor.id,
      name: buildTrainerDisplayName({
        fallbackName: instructor.name,
        clerkUser,
      }),
      imageUrl: clerkUser?.imageUrl ?? null,
    },
  });
}
