import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';

export async function requireRole(allowedRoles: string[], redirectTo = '/') {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const res = await sql`
    select role
    from "User"
    where id = ${userId}
    limit 1
  `;
  const me = res[0];
  if (!me) redirect('/sign-in');

  if (!allowedRoles.includes(me.role)) {
    redirect(redirectTo);
  }
}
