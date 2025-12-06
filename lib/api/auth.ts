// src/lib/api/auth.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export type AuthContext = {
  userId: string;
  orgId: string | null;
  sessionId: string | null;
};

/**
 * Helper d'authentification Clerk qui reproduit exactement
 * les comportements actuels (y compris treatPendingAsSignedOut).
 *
 * - Si l'utilisateur est authentifié : retourne { auth, response: null }
 * - Sinon : retourne { auth: null, response: NextResponse<401> }
 */
export function requireAuth(
  req: NextRequest,
  options?: Parameters<typeof getAuth>[1]
):
  | { auth: AuthContext; response: null }
  | { auth: null; response: NextResponse } {
  const { userId, orgId, sessionId } = getAuth(req, options);

  if (!userId) {
    return {
      auth: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  if (!orgId) {
    return {
      auth: null,
      response: NextResponse.json(
        { error: 'No active organization (no orgId)' },
        { status: 403 }
      ),
    };
  }

  return {
    auth: {
      userId,
      orgId: orgId,
      sessionId: sessionId ?? null,
    },
    response: null,
  };
}
