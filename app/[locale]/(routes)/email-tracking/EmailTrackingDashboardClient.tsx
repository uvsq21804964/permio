'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  Link2,
  Loader2,
  Lock,
  Mail,
  MousePointerClick,
  Trash2,
  UserCheck,
  UserPlus,
  UserRoundX,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  EmailTrackingRecipientInsight,
  EmailTrackingRow,
  EmailTrackingSummary,
} from '@/lib/server/services/email-tracking-service';
import type { Locale } from '@/src/lib/i18n';

const STORAGE_KEY = 'email-tracking-write-token';

export type EmailTrackingDashboardCopy = {
  title: string;
  subtitle: string;
  backToDemo: string;
  docsTitle: string;
  docsBody: string;
  searchPlaceholder: string;
  filterAll: string;
  filterOpened: string;
  filterPending: string;
  filterClicked: string;
  filterNotClicked: string;
  tracked: string;
  opened: string;
  clicked: string;
  pending: string;
  totalOpens: string;
  totalLinkOpens: string;
  openRate: string;
  linkOpenRate: string;
  recipient: string;
  subject: string;
  sentAt: string;
  latestOpen: string;
  latestClick: string;
  status: string;
  empty: string;
  statusOpened: string;
  statusPending: string;
  statusClicked: string;
  statusNotClicked: string;
  tableHint: string;
  unlockTitle: string;
  unlockBody: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  unlockAction: string;
  disconnectAction: string;
  deleteAllAction: string;
  deleteAllLoading: string;
  deleteAllConfirm: string;
  deleteAllSuccess: string;
  deleteAllError: string;
  loading: string;
  invalidPassword: string;
  genericError: string;
  noSubject: string;
  expectedTrackingId: string;
  filterAction: string;
  pixelInfo: string;
  registerInfo: string;
  redirectInfo: string;
  totalRecipients: string;
  recipientsWithAccount: string;
  convertedAfterReminder: string;
  unnecessaryReminderEmails: string;
  avgEmailsBeforeSignup: string;
  conversionSectionTitle: string;
  conversionSectionBody: string;
  conversionRecipient: string;
  conversionAccountStatus: string;
  conversionBeforeSignup: string;
  conversionUselessReminders: string;
  conversionLastEmail: string;
  conversionEmpty: string;
  accountCreated: string;
  accountMissing: string;
  accountAlreadyExisted: string;
  convertedAfterFirstEmail: string;
  convertedAfterSeveralEmails: string;
  noEmailsBeforeSignup: string;
  uselessReminderBadge: string;
  recipientInsightHint: string;
};

type Props = {
  locale: Locale;
  copy: EmailTrackingDashboardCopy;
  initialQuery: string;
  initialStatus: TrackingStatusFilter;
};

type TrackingStatusFilter = 'all' | 'opened' | 'pending' | 'clicked' | 'not-clicked';

type DashboardResponse = {
  ok: true;
  summary: EmailTrackingSummary;
  rows: EmailTrackingRow[];
  recipientInsights: EmailTrackingRecipientInsight[];
};

function formatDate(value: string | null, locale: Locale) {
  if (!value) {
    return locale === 'fr' ? 'Pas encore' : 'Not yet';
  }

  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatRelativeStatus(openCount: number, locale: Locale) {
  if (openCount > 1) {
    return locale === 'fr' ? `${openCount} ouvertures` : `${openCount} opens`;
  }

  if (openCount === 1) {
    return locale === 'fr' ? '1 ouverture' : '1 open';
  }

  return locale === 'fr' ? 'Non ouvert' : 'Unopened';
}

function getRecipientAccountLabel(
  insight: EmailTrackingRecipientInsight,
  copy: EmailTrackingDashboardCopy,
) {
  if (!insight.hasAccount) {
    return copy.accountMissing;
  }

  if (insight.alreadyHadAccountBeforeFirstEmail) {
    return copy.accountAlreadyExisted;
  }

  if (insight.convertedAfterReminder) {
    return copy.convertedAfterSeveralEmails;
  }

  if (insight.convertedAfterFirstEmail) {
    return copy.convertedAfterFirstEmail;
  }

  return copy.accountCreated;
}

export function EmailTrackingDashboardClient({
  locale,
  copy,
  initialQuery,
  initialStatus,
}: Props) {
  const [tokenInput, setTokenInput] = useState('');
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TrackingStatusFilter>(initialStatus);
  const [query, setQuery] = useState(initialQuery);
  const [summary, setSummary] = useState<EmailTrackingSummary | null>(null);
  const [rows, setRows] = useState<EmailTrackingRow[]>([]);
  const [recipientInsights, setRecipientInsights] = useState<EmailTrackingRecipientInsight[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadDashboard(token: string) {
    const response = await fetch('/api/email-tracking/dashboard', {
      method: 'GET',
      headers: {
        'x-email-tracking-token': token,
      },
      cache: 'no-store',
    });

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
      throw new Error('REQUEST_FAILED');
    }

    const payload = (await response.json()) as DashboardResponse;
    setSummary(payload.summary);
    setRows(payload.rows);
    setRecipientInsights(payload.recipientInsights);
  }

  useEffect(() => {
    const savedToken = window.localStorage.getItem(STORAGE_KEY)?.trim() || null;

    if (!savedToken) {
      setIsBootstrapping(false);
      return;
    }

    setStoredToken(savedToken);

    loadDashboard(savedToken)
      .catch((fetchError: Error) => {
        if (fetchError.message === 'UNAUTHORIZED') {
          window.localStorage.removeItem(STORAGE_KEY);
          setStoredToken(null);
          setError(copy.invalidPassword);
          return;
        }

        setError(copy.genericError);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, [copy.genericError, copy.invalidPassword]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        row.trackingId.toLowerCase().includes(normalizedQuery) ||
        (row.recipientEmail || '').toLowerCase().includes(normalizedQuery) ||
        (row.subject || '').toLowerCase().includes(normalizedQuery) ||
        (row.firstName || '').toLowerCase().includes(normalizedQuery) ||
        (row.campaignLabel || '').toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'opened' && row.openCount > 0) ||
        (statusFilter === 'pending' && row.openCount === 0) ||
        (statusFilter === 'clicked' && row.clickCount > 0) ||
        (statusFilter === 'not-clicked' && row.clickCount === 0);

      return matchesQuery && matchesStatus;
    });
  }, [query, rows, statusFilter]);

  const filteredRecipientInsights = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return recipientInsights.filter((row) => {
      if (normalizedQuery.length === 0) {
        return true;
      }

      return (
        row.recipientEmail.toLowerCase().includes(normalizedQuery) ||
        (row.displayName || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [query, recipientInsights]);

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedToken = tokenInput.trim();
    if (!trimmedToken) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setNotice(null);

    try {
      await loadDashboard(trimmedToken);
      window.localStorage.setItem(STORAGE_KEY, trimmedToken);
      setStoredToken(trimmedToken);
      setTokenInput('');
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.message === 'UNAUTHORIZED') {
        window.localStorage.removeItem(STORAGE_KEY);
        setStoredToken(null);
        setError(copy.invalidPassword);
      } else {
        setError(copy.genericError);
      }
    } finally {
      setIsSubmitting(false);
      setIsBootstrapping(false);
    }
  }

  function handleDisconnect() {
    window.localStorage.removeItem(STORAGE_KEY);
    setStoredToken(null);
    setSummary(null);
    setRows([]);
    setRecipientInsights([]);
    setError(null);
    setNotice(null);
  }

  async function handleDeleteAll() {
    if (!storedToken || isDeleting) {
      return;
    }

    const confirmed = window.confirm(copy.deleteAllConfirm);
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/email-tracking/dashboard', {
        method: 'DELETE',
        headers: {
          'x-email-tracking-token': storedToken,
        },
      });

      if (response.status === 401) {
        throw new Error('UNAUTHORIZED');
      }

      if (!response.ok) {
        throw new Error('REQUEST_FAILED');
      }

      setSummary({
        totalTracked: 0,
        totalOpened: 0,
        totalPending: 0,
        totalOpens: 0,
        openRate: 0,
        totalClicked: 0,
        totalClicks: 0,
        clickRate: 0,
        totalRecipients: 0,
        recipientsWithAccount: 0,
        recipientsCreatedAfterFirstEmail: 0,
        recipientsCreatedAfterReminder: 0,
        recipientsAlreadyHadAccount: 0,
        unnecessaryReminderEmails: 0,
        recipientsWithUnnecessaryReminders: 0,
        averageEmailsBeforeAccountCreation: 0,
      });
      setRows([]);
      setRecipientInsights([]);
      setNotice(copy.deleteAllSuccess);
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message === 'UNAUTHORIZED') {
        window.localStorage.removeItem(STORAGE_KEY);
        setStoredToken(null);
        setSummary(null);
        setRows([]);
        setRecipientInsights([]);
        setError(copy.invalidPassword);
      } else {
        setError(copy.deleteAllError);
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (isBootstrapping) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(224,247,250,0.92)_38%,rgba(236,253,245,1)_100%)] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto flex max-w-xl items-center justify-center rounded-3xl border border-slate-200/80 bg-white/90 p-8 text-slate-700 shadow-sm">
          <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          {copy.loading}
        </div>
      </main>
    );
  }

  if (!storedToken || !summary) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(224,247,250,0.92)_38%,rgba(236,253,245,1)_100%)] px-4 py-12 md:px-8 md:py-16">
        <div className="mx-auto max-w-xl">
          <Card className="border-slate-200/80 bg-white/92 shadow-[0_28px_70px_-50px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="space-y-4">
              <Badge variant="outline" className="w-fit border-emerald-300/70 bg-white/80 text-emerald-700">
                <Lock className="mr-2 h-3.5 w-3.5" />
                Pixel tracking
              </Badge>
              <div>
                <CardTitle className="text-2xl text-slate-950">{copy.unlockTitle}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                  {copy.unlockBody}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleUnlock}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-900" htmlFor="email-tracking-password">
                    {copy.passwordLabel}
                  </label>
                  <input
                    id="email-tracking-password"
                    type="password"
                    value={tokenInput}
                    onChange={(event) => setTokenInput(event.target.value)}
                    placeholder={copy.passwordPlaceholder}
                    className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-400"
                    autoComplete="current-password"
                  />
                </div>

                {error ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full bg-slate-950 text-white hover:bg-slate-800"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {copy.loading}
                    </>
                  ) : (
                    copy.unlockAction
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.98),rgba(224,247,250,0.92)_38%,rgba(236,253,245,1)_100%)] px-4 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge variant="outline" className="border-emerald-300/70 bg-white/80 text-emerald-700">
              Pixel tracking
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              {copy.title}
            </h1>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700 md:text-base">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline" className="bg-white/85">
              <Link href={`/${locale}/demo`}>{copy.backToDemo}</Link>
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="shadow-sm"
              onClick={handleDeleteAll}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {copy.deleteAllLoading}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {copy.deleteAllAction}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" className="bg-white/85" onClick={handleDisconnect}>
              {copy.disconnectAction}
            </Button>
          </div>
        </div>

        {notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Card className="border-emerald-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Mail className="h-4 w-4" />
                <CardDescription>{copy.tracked}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalTracked}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-cyan-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-cyan-700">
                <Eye className="h-4 w-4" />
                <CardDescription>{copy.opened}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalOpened}</CardTitle>
              <CardDescription>{copy.openRate}: {summary.openRate}%</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-violet-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-violet-700">
                <Link2 className="h-4 w-4" />
                <CardDescription>{copy.clicked}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalClicked}</CardTitle>
              <CardDescription>{copy.linkOpenRate}: {summary.clickRate}%</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-sky-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-sky-700">
                <UserCheck className="h-4 w-4" />
                <CardDescription>{copy.totalRecipients}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalRecipients}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-lime-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-lime-700">
                <UserPlus className="h-4 w-4" />
                <CardDescription>{copy.recipientsWithAccount}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.recipientsWithAccount}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-amber-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-amber-700">
                <MousePointerClick className="h-4 w-4" />
                <CardDescription>{copy.convertedAfterReminder}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.recipientsCreatedAfterReminder}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-rose-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-rose-700">
                <UserRoundX className="h-4 w-4" />
                <CardDescription>{copy.unnecessaryReminderEmails}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.unnecessaryReminderEmails}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-indigo-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <MousePointerClick className="h-4 w-4" />
                <CardDescription>{copy.totalLinkOpens}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalClicks}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-teal-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-teal-700">
                <Eye className="h-4 w-4" />
                <CardDescription>{copy.totalOpens}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalOpens}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80 bg-slate-950 text-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.9)]">
            <CardHeader className="gap-3">
              <CardDescription className="text-white/65">{copy.avgEmailsBeforeSignup}</CardDescription>
              <CardTitle className="text-3xl text-white">
                {summary.averageEmailsBeforeAccountCreation}
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.conversionSectionTitle}</CardTitle>
              <CardDescription>{copy.conversionSectionBody}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                {copy.recipientInsightHint}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.conversionRecipient}</th>
                      <th className="px-3 py-3 font-medium">{copy.conversionAccountStatus}</th>
                      <th className="px-3 py-3 font-medium">{copy.conversionBeforeSignup}</th>
                      <th className="px-3 py-3 font-medium">{copy.conversionUselessReminders}</th>
                      <th className="px-3 py-3 font-medium">{copy.conversionLastEmail}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecipientInsights.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          {copy.conversionEmpty}
                        </td>
                      </tr>
                    ) : (
                      filteredRecipientInsights.map((insight) => (
                        <tr key={insight.recipientEmail} className="align-top">
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {insight.displayName || insight.recipientEmail}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{insight.recipientEmail}</div>
                          </td>
                          <td className="px-3 py-4">
                            <Badge
                              variant={insight.hasAccount ? 'default' : 'outline'}
                              className={
                                insight.unnecessaryReminderCount > 0
                                  ? 'bg-rose-600 text-white'
                                  : insight.hasAccount
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-slate-700'
                              }
                            >
                              {getRecipientAccountLabel(insight, copy)}
                            </Badge>
                            <div className="mt-2 text-xs text-slate-500">
                              {formatDate(insight.accountCreatedAt, locale)}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {insight.hasAccount
                              ? insight.emailsBeforeAccountCreation > 0
                                ? `${insight.emailsBeforeAccountCreation} / ${insight.reminderCountBeforeAccountCreation}`
                                : copy.noEmailsBeforeSignup
                              : '-'}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {insight.unnecessaryReminderCount > 0 ? (
                              <div>
                                <div className="font-medium text-rose-700">
                                  {insight.unnecessaryReminderCount}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {copy.uselessReminderBadge}
                                </div>
                              </div>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(insight.lastTrackedAt, locale)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.docsTitle}</CardTitle>
              <CardDescription>{copy.docsBody}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">GET /track/open?id=&lt;trackingId&gt;</div>
                <div className="mt-1 text-xs text-slate-500">{copy.pixelInfo}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">POST /api/email-tracking/register</div>
                <div className="mt-1 text-xs text-slate-500">{copy.registerInfo}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">GET /track/redirect?id=&lt;trackingId&gt;&amp;to=&lt;base64url&gt;</div>
                <div className="mt-1 text-xs text-slate-500">{copy.redirectInfo}</div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="font-medium">{copy.expectedTrackingId}</div>
                <div className="mt-1 font-mono text-xs">recipient@example.com-1714683827</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">{copy.filterAction}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {locale === 'fr'
                    ? 'Dans le tableau conversion: emails avant inscription / nombre de relances avant inscription.'
                    : 'In the conversion table: emails before signup / reminder count before signup.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.title}</CardTitle>
              <CardDescription>{copy.tableHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
                onSubmit={(event) => event.preventDefault()}
              >
                <input
                  type="search"
                  name="q"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-0 transition focus:border-emerald-400"
                />
                <Button type="submit" className="bg-slate-950 text-white hover:bg-slate-800">
                  {copy.filterAction}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === 'opened' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('opened')}
                >
                  {copy.filterOpened}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === 'pending' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('pending')}
                >
                  {copy.filterPending}
                </Button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  {copy.filterAll}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === 'clicked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('clicked')}
                >
                  {copy.filterClicked}
                </Button>
                <Button
                  type="button"
                  variant={statusFilter === 'not-clicked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('not-clicked')}
                >
                  {copy.filterNotClicked}
                </Button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.recipient}</th>
                      <th className="px-3 py-3 font-medium">{copy.subject}</th>
                      <th className="px-3 py-3 font-medium">{copy.sentAt}</th>
                      <th className="px-3 py-3 font-medium">{copy.latestOpen}</th>
                      <th className="px-3 py-3 font-medium">{copy.latestClick}</th>
                      <th className="px-3 py-3 font-medium">{copy.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                          {copy.empty}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => (
                        <tr key={row.trackingId} className="align-top">
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {row.recipientEmail || row.trackingId}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.firstName || row.campaignLabel || row.trackingId}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {row.subject || copy.noSubject}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.sentAt || row.createdAt, locale)}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.lastOpenedAt, locale)}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            <div>{formatDate(row.lastClickedAt, locale)}</div>
                            {row.lastClickedUrl ? (
                              <div className="mt-1 max-w-[220px] truncate text-xs text-slate-500">
                                {row.lastClickedUrl}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant={row.openCount > 0 ? 'default' : 'outline'}
                                className={row.openCount > 0 ? 'bg-emerald-600 text-white' : 'text-slate-700'}
                              >
                                {row.openCount > 0 ? copy.statusOpened : copy.statusPending}
                              </Badge>
                              <Badge
                                variant={row.clickCount > 0 ? 'default' : 'outline'}
                                className={row.clickCount > 0 ? 'bg-violet-600 text-white' : 'text-slate-700'}
                              >
                                {row.clickCount > 0 ? copy.statusClicked : copy.statusNotClicked}
                              </Badge>
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              {formatRelativeStatus(row.openCount, locale)}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.clickCount} {copy.totalLinkOpens.toLowerCase()}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
