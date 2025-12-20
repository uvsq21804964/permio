import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';

type MeRow = {
  id: string;
  role: string;
  agencyId: string;
  subscription_status: string | null;
  in_grace: boolean; // <— calculé en SQL
};

type InstructorRow = {
  id: string;
  subscription_status: string | null;
  in_grace: boolean; // <— calculé en SQL
};

function withLocale(locale: string, path: string) {
  const safeLocale = locale?.trim() || 'fr';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `/${safeLocale}${cleanPath}`;
}

function isAllowed(subscription_status: string | null, inGrace: boolean) {
  return subscription_status === 'active' || inGrace === true;
}

function redirectForRole(role: string, locale: string) {
  // tu peux garder reason=subscription, ou mettre reason=trial_ended
  if (role === 'instructor')
    redirect(withLocale(locale, '/plans?reason=subscription'));
  redirect(withLocale(locale, '/profile?reason=subscription'));
}

/**
 * Autorise l'accès si :
 * - instructor : abonnement actif OU compte < 1 mois
 * - student : instructor de l'agence a abonnement actif OU compte < 1 mois
 */
export async function requirePaidSubscriptionForAgency(locale: string) {
  const { userId } = await auth();
  if (!userId) redirect(withLocale(locale, '/sign-in'));

  const meRes = await sql`
    select
      id,
      role,
      "agencyId" as "agencyId",
      subscription_status,
      ("createdAt" >= (now()::timestamp - interval '1 month')) as in_grace
    from "User"
    where id = ${userId}
    limit 1
  `;
  const me = meRes[0];
  if (!me) redirect(withLocale(locale, '/sign-in'));

  // 1) Si instructor : check direct (abo actif OU 1 mois de grâce)
  if (me.role === 'instructor') {
    if (!isAllowed(me.subscription_status, me.in_grace)) {
      redirectForRole(me.role, locale);
    }
    return;
  }

  // 2) Si student/client : check l'instructor de l'agence
  if (!me.agencyId) {
    redirectForRole(me.role, locale);
  }

  const instructors = await sql`
    select
      id,
      subscription_status,
      ("createdAt" >= (now()::timestamp - interval '1 month')) as in_grace
    from "User"
    where "agencyId" = ${me.agencyId}
      and role = 'instructor'
    limit 10
  `;

  if (instructors.length === 0) {
    redirectForRole(me.role, locale);
  }

  const hasAllowedInstructor = instructors.some((i) =>
    isAllowed(i.subscription_status, i.in_grace)
  );

  if (!hasAllowedInstructor) {
    redirectForRole(me.role, locale);
  }
}
