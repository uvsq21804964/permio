'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAgencyUsers } from '@/lib/client/hooks/useAgencyUsers';
import { type Locale, withLocale } from '@/src/lib/i18n';

function getCopy(locale: string) {
  const isFr = locale.startsWith('fr');
  return {
    title: isFr ? 'Réserver pour un client' : 'Book for a client',
    subtitle: isFr
      ? 'Choisis le client concerné, puis suis le même parcours de réservation que lui.'
      : 'Choose the client, then continue through the same booking flow they would use.',
    searchPlaceholder: isFr
      ? 'Rechercher un client...'
      : 'Search for a client...',
    loading: isFr ? 'Chargement des clients...' : 'Loading clients...',
    error: isFr
      ? 'Impossible de charger les clients.'
      : 'Unable to load clients.',
    empty: isFr
      ? 'Aucun client disponible pour le moment.'
      : 'No clients available yet.',
    noResult: isFr ? 'Aucun client trouvé.' : 'No client found.',
    start: isFr ? 'Commencer la réservation' : 'Start booking',
    selected: isFr ? 'Client sélectionné' : 'Selected client',
    noAddress: isFr ? 'Adresse non renseignée' : 'No saved address',
    manageClients: isFr ? 'Gérer les clients' : 'Manage clients',
    emailFallback: isFr ? 'Email non renseigné' : 'No email',
  };
}

export default function BookForClientPage() {
  const router = useRouter();
  const locale = useLocale();
  const copy = getCopy(locale);
  const [query, setQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const { users, loading, error } = useAgencyUsers({
    role: 'student',
    loadErrorMessage: copy.error,
  });

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) => {
      const haystack = [user.name, user.email, user.formatted_address, user.city]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, users]);

  const selectedClient = users.find((user) => user.id === selectedClientId);

  const startBooking = () => {
    if (!selectedClientId) {
      return;
    }

    const params = new URLSearchParams({ clientUserId: selectedClientId });
    router.push(
      withLocale(`/book/services?${params.toString()}`, locale as Locale),
    );
  };

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <section className="rounded-[2rem] border border-black/10 bg-card p-5 shadow-sm md:p-7">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex rounded-full border border-black/10 bg-black/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/80">
              Booking
            </span>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              {copy.title}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground md:text-base">
              {copy.subtitle}
            </p>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {copy.manageClients}
              </CardTitle>
              <input
                className="mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder={copy.searchPlaceholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">{copy.loading}</p>
              ) : null}

              {error ? (
                <p className="text-sm text-red-600">{error}</p>
              ) : null}

              {!loading && !error && users.length === 0 ? (
                <div className="space-y-3 rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
                  <p>{copy.empty}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      router.push(withLocale('/gestion', locale as Locale))
                    }
                  >
                    {copy.manageClients}
                  </Button>
                </div>
              ) : null}

              {!loading && !error && users.length > 0 && filteredClients.length === 0 ? (
                <p className="text-sm text-muted-foreground">{copy.noResult}</p>
              ) : null}

              <div className="grid gap-3">
                {filteredClients.map((client) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => setSelectedClientId(client.id)}
                      className={[
                        'rounded-2xl border p-4 text-left transition',
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-black/10 bg-background hover:border-primary/40',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {client.name || client.email || client.id}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {client.email || copy.emailFallback}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="rounded-full bg-primary px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary-foreground">
                            {copy.selected}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 truncate text-xs text-muted-foreground">
                        {client.formatted_address || copy.noAddress}
                      </p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit rounded-[1.75rem]">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">
                {copy.selected}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClient ? (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">
                    {selectedClient.name || selectedClient.email || selectedClient.id}
                  </p>
                  <p className="text-muted-foreground">
                    {selectedClient.email || copy.emailFallback}
                  </p>
                  <p className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                    {selectedClient.formatted_address || copy.noAddress}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
              )}

              <Button
                type="button"
                className="w-full"
                disabled={!selectedClientId}
                onClick={startBooking}
              >
                {copy.start}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
