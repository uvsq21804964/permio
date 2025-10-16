// components/gestion/UserManagement.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';

type Role = 'student' | 'instructor' | 'admin';
type UserRow = {
  id: string;
  name: string | null;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
};

// Ordre de tri par rôle : admin > instructor > student
const ROLE_PRIORITY: Record<Role, number> = {
  admin: 0,
  instructor: 1,
  student: 2,
};

// Tri: d’abord par rôle (priorité), puis par nom (alpha asc, insensible à la casse)
function sortUsers(list: UserRow[]): UserRow[] {
  return [...list].sort((a, b) => {
    const pr = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    if (pr !== 0) return pr;
    const an = (a.name ?? '').trim().toLocaleLowerCase();
    const bn = (b.name ?? '').trim().toLocaleLowerCase();
    if (an && bn)
      return an.localeCompare(bn, undefined, { sensitivity: 'base' });
    if (an && !bn) return -1; // noms renseignés d’abord
    if (!an && bn) return 1;
    // fallback final : trie par id pour stabilité
    return a.id.localeCompare(b.id);
  });
}

export default function UserManagement({ meRole }: { meRole: Role }) {
  const { userId, isLoaded } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const { orgId: authOrgId } = useAuth();
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
      setErr(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded) return;
    load();
  }, [isLoaded]);

  const setRole = async (id: string, role: Role) => {
    try {
      const res = await fetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role }),
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('role change error', e);
      alert(
        'Impossible de changer le rôle (droits insuffisants ou erreur serveur).'
      );
    }
  };

  const promote = (id: string) => setRole(id, 'instructor');
  const demote = (id: string) => setRole(id, 'student');

  const remove = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'utilisateur ${name || ''} ?`)) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok)
        throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
      await load();
    } catch (e) {
      console.error('delete error', e);
      alert('Suppression impossible (droits insuffisants ou erreur serveur).');
    }
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="p-4 border-b flex items-center gap-3">
        <button
          onClick={load}
          className="text-sm px-3 py-1.5 rounded border hover:bg-neutral-50"
          disabled={loading}
        >
          {loading ? 'Chargement…' : 'Rafraîchir'}
        </button>
        {err && <span className="text-sm text-red-600">{err}</span>}
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2 pr-4">Nom</th>
              <th className="py-2 pr-4">Rôle</th>
              <th className="py-2 pr-4">Actions</th>
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
                        Moi
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
                        ? 'Élève'
                        : u.role === 'instructor'
                        ? 'Moniteur'
                        : 'Admin'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 space-x-2">
                    {isSelf ? (
                      <span className="text-xs text-neutral-400 select-none">
                        Aucune action sur votre propre compte
                      </span>
                    ) : (
                      <>
                        {u.role === 'student' && (
                          <>
                            <button
                              onClick={() => promote(u.id)}
                              className="px-3 py-1.5 text-xs rounded border bg-emerald-600 text-white hover:brightness-110"
                            >
                              Promouvoir moniteur
                            </button>
                            <button
                              onClick={() => remove(u.id, u.name ?? '')}
                              className="px-3 py-1.5 text-xs rounded border hover:bg-neutral-50"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                        {u.role === 'instructor' && (
                          <button
                            onClick={() => demote(u.id)}
                            className="px-3 py-1.5 text-xs rounded border bg-amber-600 text-white hover:brightness-110"
                          >
                            Rétrograder en élève
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && !loading && (
              <tr>
                <td className="py-6 text-neutral-500" colSpan={3}>
                  Aucun utilisateur.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
