'use client';

import { useEffect, useState } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';

type Role = 'student' | 'instructor' | 'admin';

type UserRow = {
  id: string;
  name: string | null;
  role: Role;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
  plannedMinutes?: number; // total prévu (en minutes)
  remainingMinutes?: number; // restant (en minutes)
};

// Ordre de tri par rôle : admin > instructor > student
const ROLE_PRIORITY: Record<Role, number> = {
  admin: 0,
  instructor: 1,
  student: 2,
};

// Tri: rôle, puis nom
function sortUsers(list: UserRow[]): UserRow[] {
  return [...list].sort((a, b) => {
    const pr = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    if (pr !== 0) return pr;
    const an = (a.name ?? '').trim().toLocaleLowerCase();
    const bn = (b.name ?? '').trim().toLocaleLowerCase();
    if (an && bn)
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    if (an && !bn) return -1;
    if (!an && bn) return 1;
    return a.id.localeCompare(b.id);
  });
}

/** Affiche en heures si entier/0.5h, sinon minutes. */
function formatQty(m?: number): string {
  if (typeof m !== 'number' || !Number.isFinite(m)) return '—';
  if (m < 0) return '0 min';
  if (m % 30 === 0) {
    const hours = m / 60;
    return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
  }
  return `${m} min`;
}

/** Parse une saisie utilisateur en minutes.
 *  Ex: "90" -> 90, "90m" -> 90, "2h" -> 120, "2.5h" -> 150, "1,5h" -> 90
 */
function parseToMinutes(input: string | null): number | null {
  if (!input) return null;
  const s = input.trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;

  // remplace virgule décimale éventuelle
  const t = s.replace(',', '.');

  // heures ?
  if (t.endsWith('h')) {
    const num = Number(t.slice(0, -1));
    if (!Number.isFinite(num) || num < 0) return null;
    return Math.floor(num * 60);
  }
  // minutes suffixées ?
  if (t.endsWith('m')) {
    const num = Number(t.slice(0, -1));
    if (!Number.isFinite(num) || num < 0) return null;
    return Math.floor(num);
  }
  // valeur brute => minutes
  const num = Number(t);
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.floor(num);
}

export default function UserManagement({ meRole }: { meRole: Role }) {
  const t = useTranslations('userManagement');
  const { userId, isLoaded, orgId: authOrgId } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { organization } = useOrganization();
  const orgId = organization?.id ?? authOrgId ?? '';

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/users', {
        credentials: 'include',
        headers: orgId ? { 'x-org-id': orgId } : {},
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      const data = await res.json();
      const list: UserRow[] = Array.isArray(data) ? data : data?.data ?? [];
      setUsers(sortUsers(list));
    } catch (e: any) {
      setErr(e?.message ?? t('errors.load'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const setRole = async (id: string, role: Role) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId ? { 'x-org-id': orgId } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('role change error', e);
      alert(t('errors.roleChange'));
    }
  };

  const promote = (id: string) => setRole(id, 'instructor');
  const demote = (id: string) => setRole(id, 'student');

  const remove = async (id: string, name: string) => {
    if (!confirm(t('actions.remove.confirm', { name: name || '' }))) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: orgId ? { 'x-org-id': orgId } : {},
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('delete error', e);
      alert(t('errors.delete'));
    }
  };

  const addOneHour = async (id: string) => {
    try {
      const res = await fetch(`/api/users/${id}/hours`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId ? { 'x-org-id': orgId } : {}),
        },
        body: JSON.stringify({ deltaMinutes: 60 }),
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('add hour error', e);
      alert(t('errors.addHour'));
    }
  };

  const editHours = async (u: UserRow) => {
    if (u.role !== 'student') return;

    const currentRemaining =
      typeof u.remainingMinutes === 'number' ? u.remainingMinutes : 0;
    const currentPlanned =
      typeof u.plannedMinutes === 'number' ? u.plannedMinutes : 0;

    const rInput = prompt(
      t('editHours.remainingPrompt', {
        name: u.name ?? t('editHours.defaultStudentName'),
      }),
      formatQty(currentRemaining)
    );
    const remaining = parseToMinutes(rInput);
    if (remaining === null) {
      alert(t('errors.invalidRemaining'));
      return;
    }

    const tInput = prompt(
      t('editHours.totalPrompt', {
        name: u.name ?? t('editHours.defaultStudentName'),
      }),
      formatQty(currentPlanned)
    );
    const planned = parseToMinutes(tInput);
    if (planned === null) {
      alert(t('errors.invalidTotal'));
      return;
    }

    if (planned < 0 || remaining < 0) {
      alert(t('errors.invalidNonNegative'));
      return;
    }

    // borne côté front (le backend bornera aussi)
    const boundedRemaining = Math.min(remaining, planned);

    try {
      const res = await fetch(`/api/users/${u.id}/hours`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(orgId ? { 'x-org-id': orgId } : {}),
        },
        body: JSON.stringify({
          plannedMinutes: planned,
          remainingMinutes: boundedRemaining,
        }),
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('edit hours error', e);
      alert(t('errors.editHours'));
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('subtitle')}</p>
      <div className="rounded-lg border bg-card">
        <div className="p-4 border-b flex items-center gap-3">
          <button
            onClick={load}
            className="text-sm px-3 py-1.5 rounded border hover:bg-neutral-50"
            disabled={loading}
          >
            {loading ? t('toolbar.refresh.loading') : t('toolbar.refresh.idle')}
          </button>
          {err && <span className="text-sm text-red-600">{err}</span>}
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-2 pr-4">{t('table.columns.name')}</th>
                <th className="py-2 pr-4">{t('table.columns.role')}</th>
                <th className="py-2 pr-4">{t('table.columns.email')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = !!userId && u.id === userId;

                return (
                  <tr key={u.id} className="border-t">
                    <td className="py-2 pr-4">
                      <span>{u.name ?? '—'}</span>
                      {isSelf && (
                        <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border bg-blue-50 border-blue-200 text-blue-900">
                          {t('labels.me')}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs border
                      ${
                        u.role === 'admin'
                          ? 'bg-purple-50 border-purple-200 text-purple-900'
                          : u.role === 'instructor'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-700'
                      }`}
                      >
                        {u.role === 'student'
                          ? t('roles.student')
                          : u.role === 'instructor'
                          ? t('roles.instructor')
                          : t('roles.admin')}
                      </span>
                    </td>

                    <td className="py-2 pr-4">
                      {u.role === 'student' && u.email ? (
                        <a
                          href={`mailto:${encodeURIComponent(u.email)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {u.email}
                        </a>
                      ) : (
                        <span className="text-neutral-400">
                          {t('labels.noEmail')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && !loading && (
                <tr>
                  <td className="py-6 text-neutral-500" colSpan={3}>
                    {t('empty.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
