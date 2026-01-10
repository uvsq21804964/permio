// app/page.tsx
import Link from 'next/link';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Settings,
  CalendarClock,
  ChevronRight,
  Zap,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';

// --------- Textes éditables ---------
const HERO_TITLE = 'DingDog';
const HERO_SUBTITLE = 'Create time through collaboration, magically';
const HERO_TAGLINE =
  "Rejoignez la tribu des profs efficaces : votre réussite n'est qu'à un créneau d'ici.";

// Petites “preuves sociales” (facultatives)
const STAT_ITEMS = [
  { k: '+4,33x', v: 'Gain mensuel estimé' },
  { k: '< 2 min', v: 'Pour configurer vos règles' },
  { k: 'Automatique', v: 'Affectation des créneaux' },
];

export default async function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* léger dégradé d’arrière-plan */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_20%_-20%,rgba(137,32,209,0.15),rgba(137,32,209,0)_60%)]"
        />
        <div className="mx-auto max-w-5xl px-6 pt-16 pb-10">
          <div className="text-center space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              {HERO_TITLE}
            </h1>
            <h2 className="text-xl md:text-2xl font-semibold text-foreground/90">
              {HERO_SUBTITLE}
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl">
              {HERO_TAGLINE}
            </p>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="group">
              <Link href="/myavailabilities">
                Gérer mes disponibilités
                <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/configuration">Configurer l’optimisation</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/myweek">Voir ma semaine</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {STAT_ITEMS.map(({ k, v }) => (
              <div
                key={v}
                className="rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm"
              >
                <span className="font-semibold text-foreground">{k}</span>
                <span className="mx-2">•</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actions rapides */}
      <section className="mx-auto max-w-5xl px-6 pb-10">
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/myavailabilities" className="h-full">
            <Card className="h-full transition hover:shadow-md hover:border-primary/60">
              <CardHeader>
                <Calendar className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Agenda</CardTitle>
                <CardDescription>
                  Gérer les disponibilités et créneaux de cours
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/configuration" className="h-full">
            <Card className="h-full transition hover:shadow-md hover:border-primary/60">
              <CardHeader>
                <Settings className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Configuration</CardTitle>
                <CardDescription>
                  Paramétrer les règles et priorités d’affectation
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/myweek" className="h-full">
            <Card className="h-full transition hover:shadow-md hover:border-primary/60">
              <CardHeader>
                <CalendarClock className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Ma semaine</CardTitle>
                <CardDescription>
                  Visualiser l’emploi du temps optimisé
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <h3 className="mb-6 text-center text-2xl font-semibold">
          Comment ça marche&nbsp;?
        </h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>1. Renseignez vos contraintes</CardTitle>
              <CardDescription>
                Vos disponibilités, vos préférences, vos durées de cours… le
                moteur s’adapte.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>2. Lancez l’optimisation</CardTitle>
              <CardDescription>
                Nous calculons la meilleure répartition possible,
                automatiquement.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader>
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>3. Validez & partagez</CardTitle>
              <CardDescription>
                Visualisez votre semaine, ajustez au besoin et partagez avec vos
                élèves.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}

{
  /* <h1 className="text-4xl font-bold text-foreground">DingDog</h1>
          <h2 className="text-xl font-bold text-foreground">
            Create time through collaboration, magically
          </h2>
          <p className="text-muted-foreground text-lg">
            Learning with a mentor deserves time - slot it and watch you evolve.
          </p>
          <p className="text-muted-foreground text-lg">
            Join the tribe of fast learners. Progress is one slot away, your
            success starts here.
          </p> */
}
