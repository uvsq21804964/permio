import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Eye, Mail, MousePointerClick, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getEmailTrackingDashboard } from '@/lib/server/services/email-tracking-service';
import type { Locale } from '@/src/lib/i18n';

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
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

function getCopy(locale: Locale) {
  if (locale === 'fr') {
    return {
      title: 'Suivi des emails',
      subtitle:
        'Tableau de bord pour suivre les emails envoyés par ton script et voir qui a ouvert le pixel de tracking.',
      backToDemo: 'Retour à la démo',
      docsTitle: 'À brancher dans le script',
      docsBody:
        'Le pixel fonctionne déjà avec /track/open?id=.... Pour voir aussi les emails envoyés mais pas encore ouverts, le script peut appeler l’endpoint POST /api/email-tracking/register juste après chaque envoi SMTP.',
      searchPlaceholder: 'Rechercher un email, un sujet ou un tracking id',
      filterAll: 'Tous',
      filterOpened: 'Ouverts',
      filterPending: 'En attente',
      tracked: 'Emails trackés',
      opened: 'Emails ouverts',
      pending: 'Pas encore ouverts',
      totalOpens: 'Ouvertures totales',
      openRate: 'Taux d’ouverture',
      recipient: 'Destinataire',
      subject: 'Sujet',
      sentAt: 'Envoyé',
      latestOpen: 'Dernière ouverture',
      status: 'Statut',
      empty: 'Aucun email ne correspond à ce filtre pour le moment.',
      statusOpened: 'Ouvert',
      statusPending: 'En attente',
      tableHint:
        'Les ouvertures sont dédupliquées par tracking id. Plusieurs chargements du pixel incrémentent le compteur.',
    };
  }

  return {
    title: 'Email tracking',
    subtitle:
      'Dashboard to monitor emails sent by your script and see who loaded the tracking pixel.',
    backToDemo: 'Back to demo',
    docsTitle: 'How to wire the script',
    docsBody:
      'The pixel already works with /track/open?id=.... To also display sent emails that have not been opened yet, the script can call POST /api/email-tracking/register right after each SMTP send.',
    searchPlaceholder: 'Search by email, subject, or tracking id',
    filterAll: 'All',
    filterOpened: 'Opened',
    filterPending: 'Pending',
    tracked: 'Tracked emails',
    opened: 'Opened emails',
    pending: 'Not opened yet',
    totalOpens: 'Total opens',
    openRate: 'Open rate',
    recipient: 'Recipient',
    subject: 'Subject',
    sentAt: 'Sent',
    latestOpen: 'Latest open',
    status: 'Status',
    empty: 'No email matches this filter yet.',
    statusOpened: 'Opened',
    statusPending: 'Pending',
    tableHint:
      'Opens are deduplicated by tracking id. Multiple pixel loads increase the counter.',
  };
}

export default async function EmailTrackingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const copy = getCopy(locale);
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const query = resolvedSearchParams.q?.trim().toLowerCase() || '';
  const statusFilter = resolvedSearchParams.status === 'opened'
    ? 'opened'
    : resolvedSearchParams.status === 'pending'
      ? 'pending'
      : 'all';

  const { summary, rows } = await getEmailTrackingDashboard();

  const filteredRows = rows.filter((row) => {
    const matchesQuery =
      query.length === 0 ||
      row.trackingId.toLowerCase().includes(query) ||
      (row.recipientEmail || '').toLowerCase().includes(query) ||
      (row.subject || '').toLowerCase().includes(query) ||
      (row.firstName || '').toLowerCase().includes(query) ||
      (row.campaignLabel || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'opened' ? row.openCount > 0 : row.openCount === 0);

    return matchesQuery && matchesStatus;
  });

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
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 md:text-base">
              {copy.subtitle}
            </p>
          </div>

          <Button asChild variant="outline" className="bg-white/85">
            <Link href={`/${locale}/demo`}>{copy.backToDemo}</Link>
          </Button>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
            </CardHeader>
          </Card>

          <Card className="border-amber-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Search className="h-4 w-4" />
                <CardDescription>{copy.pending}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalPending}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-sky-200/70 bg-white/88 backdrop-blur">
            <CardHeader className="gap-3">
              <div className="flex items-center gap-2 text-sky-700">
                <MousePointerClick className="h-4 w-4" />
                <CardDescription>{copy.totalOpens}</CardDescription>
              </div>
              <CardTitle className="text-3xl">{summary.totalOpens}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="border-slate-200/80 bg-slate-950 text-white shadow-[0_28px_70px_-50px_rgba(15,23,42,0.9)]">
            <CardHeader className="gap-3">
              <CardDescription className="text-white/65">{copy.openRate}</CardDescription>
              <CardTitle className="text-3xl text-white">{summary.openRate}%</CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.title}</CardTitle>
              <CardDescription>{copy.tableHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
                <input
                  type="search"
                  name="q"
                  defaultValue={resolvedSearchParams.q || ''}
                  placeholder={copy.searchPlaceholder}
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none ring-0 transition focus:border-emerald-400"
                />
                <input type="hidden" name="status" value={statusFilter} />
                <Button type="submit" className="bg-slate-950 text-white hover:bg-slate-800">
                  {locale === 'fr' ? 'Filtrer' : 'Filter'}
                </Button>
                <Button asChild type="button" variant={statusFilter === 'opened' ? 'default' : 'outline'}>
                  <Link
                    href={`/${locale}/email-tracking?${new URLSearchParams({
                      ...(resolvedSearchParams.q ? { q: resolvedSearchParams.q } : {}),
                      status: 'opened',
                    }).toString()}`}
                  >
                    {copy.filterOpened}
                  </Link>
                </Button>
                <Button asChild type="button" variant={statusFilter === 'pending' ? 'default' : 'outline'}>
                  <Link
                    href={`/${locale}/email-tracking?${new URLSearchParams({
                      ...(resolvedSearchParams.q ? { q: resolvedSearchParams.q } : {}),
                      status: 'pending',
                    }).toString()}`}
                  >
                    {copy.filterPending}
                  </Link>
                </Button>
              </form>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild type="button" variant={statusFilter === 'all' ? 'default' : 'outline'} size="sm">
                  <Link
                    href={`/${locale}/email-tracking${resolvedSearchParams.q ? `?${new URLSearchParams({ q: resolvedSearchParams.q }).toString()}` : ''}`}
                  >
                    {copy.filterAll}
                  </Link>
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
                      <th className="px-3 py-3 font-medium">{copy.status}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
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
                            {row.subject || (locale === 'fr' ? 'Sujet non enregistré' : 'No subject registered')}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.sentAt || row.createdAt, locale)}
                          </td>
                          <td className="px-3 py-4 text-slate-700">
                            {formatDate(row.lastOpenedAt, locale)}
                          </td>
                          <td className="px-3 py-4">
                            <Badge
                              variant={row.openCount > 0 ? 'default' : 'outline'}
                              className={row.openCount > 0 ? 'bg-emerald-600 text-white' : 'text-slate-700'}
                            >
                              {row.openCount > 0 ? copy.statusOpened : copy.statusPending}
                            </Badge>
                            <div className="mt-2 text-xs text-slate-500">
                              {formatRelativeStatus(row.openCount, locale)}
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

          <Card className="border-slate-200/70 bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>{copy.docsTitle}</CardTitle>
              <CardDescription>{copy.docsBody}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">GET /track/open?id=&lt;trackingId&gt;</div>
                <div className="mt-1 text-xs text-slate-500">
                  {locale === 'fr'
                    ? 'Compteur d’ouverture déclenché par le pixel dans le HTML.'
                    : 'Open counter triggered by the pixel in the HTML.'}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-medium text-slate-900">POST /api/email-tracking/register</div>
                <div className="mt-1 text-xs text-slate-500">
                  {locale === 'fr'
                    ? 'Optionnel mais recommandé pour afficher aussi les emails envoyés avant leur première ouverture.'
                    : 'Optional but recommended to display sent emails before their first open.'}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="font-medium">
                  {locale === 'fr' ? 'Tracking ID attendu' : 'Expected tracking ID'}
                </div>
                <div className="mt-1 font-mono text-xs">recipient@example.com-1714683827</div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
