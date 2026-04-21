import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

type RequireAuthOptions = Parameters<typeof getAuth>[1];

type UserAuthContext = {
  userId: string;
  orgId: string | null;
  sessionId: string | null;
};

type OrgUserAuthContext = {
  userId: string;
  orgId: string;
  sessionId: string | null;
};

type AuthFailure = {
  auth: null;
  response: NextResponse;
};

type UserAuthSuccess = {
  auth: UserAuthContext;
  response: null;
};

type OrgUserAuthSuccess = {
  auth: OrgUserAuthContext;
  response: null;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function missingOrganization() {
  return NextResponse.json(
    { error: 'No active organization (no orgId)' },
    { status: 403 }
  );
}

export function requireUser(
  req: NextRequest,
  options?: RequireAuthOptions
): UserAuthSuccess | AuthFailure {
  const { userId, orgId, sessionId } = getAuth(req, options);

  if (!userId) {
    return {
      auth: null,
      response: unauthorized(),
    };
  }

  return {
    auth: {
      userId,
      orgId: orgId ?? null,
      sessionId: sessionId ?? null,
    },
    response: null,
  };
}

export function requireOrgUser(
  req: NextRequest,
  options?: RequireAuthOptions
): OrgUserAuthSuccess | AuthFailure {
  const { userId, orgId, sessionId } = getAuth(req, options);

  if (!userId) {
    return {
      auth: null,
      response: unauthorized(),
    };
  }

  if (!orgId) {
    return {
      auth: null,
      response: missingOrganization(),
    };
  }

  return {
    auth: {
      userId,
      orgId,
      sessionId: sessionId ?? null,
    },
    response: null,
  };
}
