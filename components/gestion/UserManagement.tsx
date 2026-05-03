'use client';

import { useState } from 'react';
import { useAuth, useOrganization } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useAgencyUsers } from '@/lib/client/hooks/useAgencyUsers';

type Role = 'student' | 'instructor' | 'admin';

type UserRow = {
  id: string;
  name: string | null;
  role: Role;
  email?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const ROLE_PRIORITY: Record<Role, number> = {
  admin: 0,
  instructor: 1,
  student: 2,
};

function sortUsers(list: UserRow[]): UserRow[] {
  return [...list].sort((a, b) => {
    const priority = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    if (priority !== 0) return priority;

    const left = (a.name ?? '').trim().toLocaleLowerCase();
    const right = (b.name ?? '').trim().toLocaleLowerCase();

    if (left && right) {
      return left.localeCompare(right, undefined, { sensitivity: 'base' });
    }

    if (left && !right) return -1;
    if (!left && right) return 1;
    return a.id.localeCompare(b.id);
  });
}

export default function UserManagement({ meRole: _meRole }: { meRole: Role }) {
  const t = useTranslations('userManagement');
  const locale = useLocale();
  const { userId, isLoaded, orgId: authOrgId } = useAuth();
  const { organization } = useOrganization();

  const orgId = organization?.id ?? authOrgId ?? '';
  const {
    users: loadedUsers,
    loading,
    error,
    reload,
  } = useAgencyUsers({
    enabled: isLoaded,
    orgId,
    loadErrorMessage: t('errors.load'),
  });

  const users = sortUsers(loadedUsers as UserRow[]);
  const [exporting, setExporting] = useState(false);
  const [exportingUserId, setExportingUserId] = useState<string | null>(null);

  const downloadStudentsExport = async () => {
    try {
      setExporting(true);

      const response = await fetch(
        `/api/users/export?locale=${encodeURIComponent(locale)}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);

      link.href = url;
      link.download =
        filenameMatch?.[1] ||
        (locale === 'en' ? 'clients-export.xls' : 'export-clients.xls');

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      console.error('export users error', nextError);
      toast.error(t('errors.export'));
    } finally {
      setExporting(false);
    }
  };

  const downloadStudentDetailsExport = async (user: UserRow) => {
    try {
      setExportingUserId(user.id);

      const response = await fetch(
        `/api/users/${encodeURIComponent(user.id)}/export?locale=${encodeURIComponent(locale)}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = response.headers.get('content-disposition') ?? '';
      const filenameMatch = contentDisposition.match(/filename="([^"]+)"/i);

      link.href = url;
      link.download =
        filenameMatch?.[1] ||
        (locale === 'en' ? 'client-details.xls' : 'client-details.xls');

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      console.error('export user details error', nextError);
      toast.error(t('errors.exportDetails'));
    } finally {
      setExportingUserId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-2 text-2xl font-semibold">{t('title')}</h1>
      <p className="mb-6 text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b p-4">
          <button
            onClick={reload}
            className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50"
            disabled={loading}
          >
            {loading ? t('toolbar.refresh.loading') : t('toolbar.refresh.idle')}
          </button>

          {error ? <span className="text-sm text-red-600">{error}</span> : null}

          <button
            onClick={downloadStudentsExport}
            className="ml-auto rounded border px-3 py-1.5 text-sm hover:bg-neutral-50"
            disabled={exporting}
          >
            {exporting ? t('toolbar.export.loading') : t('toolbar.export.idle')}
          </button>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="py-2 pr-4">{t('table.columns.name')}</th>
                <th className="py-2 pr-4">{t('table.columns.role')}</th>
                <th className="py-2 pr-4">{t('table.columns.email')}</th>
                <th className="py-2 pr-4">{t('table.columns.export')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = !!userId && user.id === userId;

                return (
                  <tr key={user.id} className="border-t">
                    <td className="py-2 pr-4">
                      <span>{user.name ?? '—'}</span>
                      {isSelf ? (
                        <span className="ml-2 inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-900">
                          {t('labels.me')}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-2 pr-4">
                      <span
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs ${
                          user.role === 'admin'
                            ? 'border-purple-200 bg-purple-50 text-purple-900'
                            : user.role === 'instructor'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                              : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        {user.role === 'student'
                          ? t('roles.student')
                          : user.role === 'instructor'
                            ? t('roles.instructor')
                            : t('roles.admin')}
                      </span>
                    </td>

                    <td className="py-2 pr-4">
                      {user.role === 'student' && user.email ? (
                        <a
                          href={`mailto:${encodeURIComponent(user.email)}`}
                          className="text-blue-600 hover:underline"
                        >
                          {user.email}
                        </a>
                      ) : (
                        <span className="text-neutral-400">{t('labels.noEmail')}</span>
                      )}
                    </td>

                    <td className="py-2 pr-4">
                      {user.role === 'student' ? (
                        <button
                          onClick={() => void downloadStudentDetailsExport(user)}
                          className="rounded border px-3 py-1.5 text-xs hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={exportingUserId === user.id}
                        >
                          {exportingUserId === user.id
                            ? t('actions.exportRow.loading')
                            : t('actions.exportRow.idle')}
                        </button>
                      ) : (
                        <span className="text-neutral-300">{t('labels.noExport')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && !loading ? (
                <tr>
                  <td className="py-6 text-neutral-500" colSpan={4}>
                    {t('empty.noUsers')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
