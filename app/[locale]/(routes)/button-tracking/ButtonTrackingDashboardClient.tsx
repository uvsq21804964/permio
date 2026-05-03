'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Clock3,
  Loader2,
  Lock,
  MousePointerClick,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ButtonTrackingEventRow,
  ButtonTrackingSummary,
  ButtonTrackingTopButtonRow,
  ButtonTrackingTopPageRow,
  ButtonTrackingTopUserRow,
  ButtonTrackingUserJourneyStep,
  ButtonTrackingUserOption,
} from '@/lib/server/services/button-tracking-service';
import type { Locale } from '@/src/lib/i18n';

const STORAGE_KEY = 'email-tracking-write-token';

export type ButtonTrackingDashboardCopy = {
  title: string;
  subtitle: string;
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
  invalidPassword: string;
  loading: string;
  genericError: string;
  backToDemo: string;
  trackedButtonHint: string;
  totalClicks: string;
  uniqueButtons: string;
  uniquePages: string;
  uniqueUsers: string;
  authenticatedClicks: string;
  anonymousClicks: string;
  clicksLast24Hours: string;
  clicksLast7Days: string;
  topButtonsTitle: string;
  topPagesTitle: string;
  topUsersTitle: string;
  recentEventsTitle: string;
  journeyTitle: string;
  journeyBody: string;
  journeySelectLabel: string;
  journeySelectPlaceholder: string;
  journeyEmpty: string;
  journeyEventColumn: string;
  journeyDurationColumn: string;
  eventPageView: string;
  eventPageLeave: string;
  eventButtonClick: string;
  buttonColumn: string;
  contextColumn: string;
  clicksColumn: string;
  visitorsColumn: string;
  latestClickColumn: string;
  pageColumn: string;
  userColumn: string;
  roleColumn: string;
  uniqueButtonsColumn: string;
  targetColumn: string;
  metadataColumn: string;
  timeColumn: string;
  noData: string;
  anonymousLabel: string;
  authenticatedLabel: string;
  docsTitle: string;
  docsBody: string;
  exampleTitle: string;
};

type Props = {
  locale: Locale;
  copy: ButtonTrackingDashboardCopy;
};

type DashboardResponse = {
  ok: true;
  summary: ButtonTrackingSummary;
  topButtons: ButtonTrackingTopButtonRow[];
  topPages: ButtonTrackingTopPageRow[];
  topUsers: ButtonTrackingTopUserRow[];
  userOptions: ButtonTrackingUserOption[];
  recentEvents: ButtonTrackingEventRow[];
};

type UserJourneyResponse = {
  ok: true;
  journey: ButtonTrackingUserJourneyStep[];
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

function formatDuration(value: number | null, locale: Locale) {
  if (value == null) {
    return '-';
  }

  const totalSeconds = Math.max(Math.round(value / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return locale === 'fr' ? `${seconds} s` : `${seconds}s`;
  }

  return locale === 'fr' ? `${minutes} min ${seconds} s` : `${minutes}m ${seconds}s`;
}

function getJourneyEventLabel(
  step: ButtonTrackingUserJourneyStep,
  copy: ButtonTrackingDashboardCopy,
) {
  if (step.eventType === 'page_view') {
    return copy.eventPageView;
  }

  if (step.eventType === 'page_leave') {
    return copy.eventPageLeave;
  }

  return step.buttonLabel || copy.eventButtonClick;
}

export function ButtonTrackingDashboardClient({ locale, copy }: Props) {
  const [tokenInput, setTokenInput] = useState('');
  const [storedToken, setStoredToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<ButtonTrackingSummary | null>(null);
  const [topButtons, setTopButtons] = useState<ButtonTrackingTopButtonRow[]>([]);
  const [topPages, setTopPages] = useState<ButtonTrackingTopPageRow[]>([]);
  const [topUsers, setTopUsers] = useState<ButtonTrackingTopUserRow[]>([]);
  const [userOptions, setUserOptions] = useState<ButtonTrackingUserOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userJourney, setUserJourney] = useState<ButtonTrackingUserJourneyStep[]>([]);
  const [isLoadingJourney, setIsLoadingJourney] = useState(false);
  const [recentEvents, setRecentEvents] = useState<ButtonTrackingEventRow[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadDashboard(token: string) {
    const response = await fetch('/api/button-tracking/dashboard', {
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
    setTopButtons(payload.topButtons);
    setTopPages(payload.topPages);
    setTopUsers(payload.topUsers);
    setUserOptions(payload.userOptions);
    setSelectedUserId((currentUserId) => currentUserId || payload.userOptions[0]?.userId || '');
    setRecentEvents(payload.recentEvents);
  }

  useEffect(() => {
    if (!storedToken || !selectedUserId) {
      setUserJourney([]);
      return;
    }

    setIsLoadingJourney(true);
    fetch(`/api/button-tracking/user-journey?userId=${encodeURIComponent(selectedUserId)}`, {
      method: 'GET',
      headers: {
        'x-email-tracking-token': storedToken,
      },
      cache: 'no-store',
    })
      .then(async (response) => {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }

        if (!response.ok) {
          throw new Error('REQUEST_FAILED');
        }

        const payload = (await response.json()) as UserJourneyResponse;
        setUserJourney(payload.journey);
      })
      .catch((fetchError: Error) => {
        if (fetchError.message === 'UNAUTHORIZED') {
          window.localStorage.removeItem(STORAGE_KEY);
          setStoredToken(null);
          setSummary(null);
          setError(copy.invalidPassword);
          return;
        }

        setError(copy.genericError);
      })
      .finally(() => {
        setIsLoadingJourney(false);
      });
  }, [copy.genericError, copy.invalidPassword, selectedUserId, storedToken]);

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
    setTopButtons([]);
    setTopPages([]);
    setTopUsers([]);
    setUserOptions([]);
    setSelectedUserId('');
    setUserJourney([]);
    setRecentEvents([]);
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
      const response = await fetch('/api/button-tracking/dashboard', {
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
        totalClicks: 0,
        uniqueButtons: 0,
        uniquePages: 0,
        uniqueUsers: 0,
        authenticatedClicks: 0,
        anonymousClicks: 0,
        clicksLast24Hours: 0,
        clicksLast7Days: 0,
      });
      setTopButtons([]);
      setTopPages([]);
      setTopUsers([]);
      setUserOptions([]);
      setSelectedUserId('');
      setUserJourney([]);
      setRecentEvents([]);
      setNotice(copy.deleteAllSuccess);
    } catch (deleteError) {
      if (deleteError instanceof Error && deleteError.message === 'UNAUTHORIZED') {
        window.localStorage.removeItem(STORAGE_KEY);
        setStoredToken(null);
        setSummary(null);
        setTopButtons([]);
        setTopPages([]);
        setTopUsers([]);
        setUserOptions([]);
        setSelectedUserId('');
        setUserJourney([]);
        setRecentEvents([]);
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
                Button tracking
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
                  <label className="text-sm font-medium text-slate-900" htmlFor="button-tracking-password">
                    {copy.passwordLabel}
                  </label>
                  <input
                    id="button-tracking-password"
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
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Button tracking
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

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-emerald-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <MousePointerClick className="h-4 w-4" />
                <CardDescription>{copy.totalClicks}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalClicks}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-cyan-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-cyan-700">
                <BarChart3 className="h-4 w-4" />
                <CardDescription>{copy.uniqueButtons}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.uniqueButtons}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-violet-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-violet-700">
                <Users className="h-4 w-4" />
                <CardDescription>{copy.uniqueUsers}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.uniqueUsers}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-sky-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-sky-700">
                <Clock3 className="h-4 w-4" />
                <CardDescription>{copy.clicksLast24Hours}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.clicksLast24Hours}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-slate-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <CardDescription>{copy.uniquePages}</CardDescription>
              <CardTitle className="text-3xl">{summary.uniquePages}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <CardDescription>{copy.authenticatedClicks}</CardDescription>
              <CardTitle className="text-3xl">{summary.authenticatedClicks}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <CardDescription>{copy.anonymousClicks}</CardDescription>
              <CardTitle className="text-3xl">{summary.anonymousClicks}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80 bg-slate-950 text-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.9)]">
            <CardHeader className="gap-3">
              <CardDescription className="text-white/65">{copy.clicksLast7Days}</CardDescription>
              <CardTitle className="text-3xl text-white">{summary.clicksLast7Days}</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.topButtonsTitle}</CardTitle>
              <CardDescription>{copy.trackedButtonHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.buttonColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.contextColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.clicksColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.visitorsColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.latestClickColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topButtons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                          {copy.noData}
                        </td>
                      </tr>
                    ) : (
                      topButtons.map((row) => (
                        <tr key={row.buttonKey} className="align-top">
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {row.buttonLabel || row.buttonKey}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">{row.buttonKey}</div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">{row.buttonContext || '-'}</td>
                          <td className="px-3 py-4 text-slate-700">{row.totalClicks}</td>
                          <td className="px-3 py-4 text-slate-700">{row.uniqueVisitors}</td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.lastClickedAt, locale)}
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
                <div className="font-medium text-slate-900">{copy.exampleTitle}</div>
                <pre className="mt-2 overflow-x-auto text-xs text-slate-600">
{`<TrackedButton
  href="/fr/sign-up"
  trackingKey="hero_start_trial"
  trackingLabel="Demarrer l'essai"
  trackingContext="hero_home"
>
  Demarrer l'essai
</TrackedButton>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-2">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.topPagesTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.pageColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.clicksColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.uniqueButtonsColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.visitorsColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topPages.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                          {copy.noData}
                        </td>
                      </tr>
                    ) : (
                      topPages.map((row) => (
                        <tr key={row.pagePath} className="align-top">
                          <td className="px-3 py-4 font-medium text-slate-900">{row.pagePath}</td>
                          <td className="px-3 py-4 text-slate-700">{row.totalClicks}</td>
                          <td className="px-3 py-4 text-slate-700">{row.uniqueButtons}</td>
                          <td className="px-3 py-4 text-slate-700">{row.uniqueVisitors}</td>
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
              <CardTitle>{copy.topUsersTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.userColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.roleColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.clicksColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.uniqueButtonsColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                          {copy.noData}
                        </td>
                      </tr>
                    ) : (
                      topUsers.map((row) => (
                        <tr key={row.userId} className="align-top">
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {row.userName || row.userEmail || row.userId}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.userEmail || row.userId}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">{row.userRole || '-'}</td>
                          <td className="px-3 py-4 text-slate-700">{row.totalClicks}</td>
                          <td className="px-3 py-4 text-slate-700">{row.uniqueButtons}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{copy.journeyTitle}</CardTitle>
                  <CardDescription className="mt-2">{copy.journeyBody}</CardDescription>
                </div>

                <label className="flex min-w-[260px] flex-col gap-2 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{copy.journeySelectLabel}</span>
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-400"
                  >
                    <option value="">{copy.journeySelectPlaceholder}</option>
                    {userOptions.map((user) => (
                      <option key={user.userId} value={user.userId}>
                        {user.userName || user.userEmail || user.userId}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingJourney ? (
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {copy.loading}
                </div>
              ) : userJourney.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {copy.journeyEmpty}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead>
                      <tr className="text-slate-500">
                        <th className="px-3 py-3 font-medium">{copy.timeColumn}</th>
                        <th className="px-3 py-3 font-medium">{copy.journeyEventColumn}</th>
                        <th className="px-3 py-3 font-medium">{copy.pageColumn}</th>
                        <th className="px-3 py-3 font-medium">{copy.buttonColumn}</th>
                        <th className="px-3 py-3 font-medium">{copy.targetColumn}</th>
                        <th className="px-3 py-3 font-medium">{copy.journeyDurationColumn}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userJourney.map((step) => (
                        <tr key={step.id} className="align-top">
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(step.createdAt, locale)}
                          </td>
                          <td className="px-3 py-4">
                            <Badge
                              variant={step.eventType === 'button_click' ? 'default' : 'outline'}
                              className={
                                step.eventType === 'button_click'
                                  ? 'bg-slate-950 text-white'
                                  : step.eventType === 'page_leave'
                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                              }
                            >
                              {getJourneyEventLabel(step, copy)}
                            </Badge>
                          </td>
                          <td className="px-3 py-4 text-slate-700">{step.pagePath || '-'}</td>
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {step.eventType === 'button_click'
                                ? step.buttonLabel || step.buttonKey
                                : '-'}
                            </div>
                            {step.eventType === 'button_click' ? (
                              <div className="mt-1 text-xs text-slate-500">{step.buttonKey}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            <div className="max-w-[260px] truncate">{step.targetHref || '-'}</div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDuration(step.durationMs, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-8">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.recentEventsTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead>
                    <tr className="text-slate-500">
                      <th className="px-3 py-3 font-medium">{copy.timeColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.buttonColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.pageColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.userColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.targetColumn}</th>
                      <th className="px-3 py-3 font-medium">{copy.metadataColumn}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentEvents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                          {copy.noData}
                        </td>
                      </tr>
                    ) : (
                      recentEvents.map((row) => (
                        <tr key={row.id} className="align-top">
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.createdAt, locale)}
                          </td>
                          <td className="px-3 py-4">
                            <div className="font-medium text-slate-900">
                              {row.buttonLabel || row.buttonKey}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.buttonContext || row.buttonKey}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">{row.pagePath || '-'}</td>
                          <td className="px-3 py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-medium text-slate-900">
                                {row.userName || row.userEmail || row.userId || copy.anonymousLabel}
                              </div>
                              <Badge
                                variant={row.isAuthenticated ? 'default' : 'outline'}
                                className={row.isAuthenticated ? 'bg-emerald-600 text-white' : 'text-slate-700'}
                              >
                                {row.isAuthenticated ? copy.authenticatedLabel : copy.anonymousLabel}
                              </Badge>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {row.userEmail || row.userId || '-'}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            <div className="max-w-[240px] truncate">{row.targetHref || '-'}</div>
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            <div className="max-w-[260px] truncate font-mono text-xs">
                              {row.metadataJson || '-'}
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
