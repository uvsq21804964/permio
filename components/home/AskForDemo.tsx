// app/pricing/plan-comparison.tsx
'use client';

import { ArrowRight, Check, X } from 'lucide-react';
import { Sparkles } from 'lucide-react';

import { toast } from 'sonner';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function AskForDemo({ className }: { className?: string }) {
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = new FormData(e.currentTarget).get('email') as string;
    toast('Demande envoyée', {
      description: `Nous vous contacterons à ${email}.`,
    });
    e.currentTarget.reset();
  }

  return (
    <main>
      <section>
        <div className="relative mx-auto max-w-5xl">
          <Card className="border-brand/40 bg-card/60 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/40">
            <CardContent className="py-8 md:py-12">
              <div className="grid gap-8 md:grid-cols-2 md:items-start">
                {/* Colonne texte */}
                <div className="space-y-4 break-words">
                  <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground/90 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span className="whitespace-normal break-words">
                      MagicHango • Optimisez chaque créneau
                    </span>
                  </div>

                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance leading-relaxed">
                    <span className="bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-transparent">
                      La réservation pro
                    </span>{' '}
                    qui remplit votre agenda (sans chaos).
                  </h2>

                  <p className="text-pretty text-muted-foreground leading-relaxed">
                    Page de réservation pour vos élèves, collecte de
                    disponibilités hebdomadaires, et moteur qui compacte vos
                    horaires intelligemment. Résultat : moins de trous, plus
                    d’élèves servis.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button
                      asChild
                      size="lg"
                      className="bg-brand-gradient hover:opacity-95 border-0 text-white shadow"
                    >
                      <Link
                        href="/sign-up"
                        aria-label="Démarrer l’essai gratuit"
                      >
                        Tester 1 mois gratuitement
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                      className="border-brand/40 text-foreground hover:bg-brand3/40 focus-visible:ring-brand"
                    >
                      <Link
                        href="/demo"
                        aria-label="Voir un exemple de planning optimisé"
                      >
                        Voir un exemple <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* ===== Avantages : liste WRAP sur mobile / MARQUEE dès sm ===== */}
                  {/* Mobile: liste qui wrap (aucun débordement possible) */}
                  <div className="sm:hidden mt-4">
                    <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground/90">
                      <li className="shrink min-w-0">
                        Page de réservation professionnelle
                      </li>
                      <li className="shrink min-w-0">
                        Priorisation des créneaux « orphelins »
                      </li>
                      <li className="shrink min-w-0">
                        Remplacement automatique des annulations
                      </li>
                      <li className="shrink min-w-0">
                        Buffers protégés entre cours
                      </li>
                      <li className="shrink min-w-0">
                        Mode multi-prof (basique)
                      </li>
                      <li className="shrink min-w-0">EUR et USD</li>
                      <li className="shrink min-w-0">
                        Essai 1 mois sans carte
                      </li>
                    </ul>
                  </div>

                  {/* ≥ sm: ruban défilant, clipé proprement */}
                  <div className="relative mt-4 overflow-hidden hidden sm:block">
                    <div className="flex w-[200%] animate-[marquee_25s_linear_infinite] gap-6 whitespace-nowrap text-sm text-muted-foreground/90 will-change-transform">
                      <span>Page de réservation professionnelle</span>•
                      <span>Priorisation des créneaux « orphelins »</span>•
                      <span>Remplacement automatique des annulations</span>•
                      <span>Buffers protégés entre cours</span>•
                      <span>Mode multi-prof (basique)</span>•
                      <span>EUR et USD</span>•
                      <span>Essai 1 mois sans carte</span>•
                      {/* duplication pour boucler */}
                      <span>Page de réservation professionnelle</span>•
                      <span>Priorisation des créneaux « orphelins »</span>•
                      <span>Remplacement automatique des annulations</span>•
                      <span>Buffers protégés entre cours</span>•
                      <span>Mode multi-prof (basique)</span>•
                      <span>EUR et USD</span>•
                      <span>Essai 1 mois sans carte</span>
                    </div>
                  </div>
                  {/* ===== /Avantages ===== */}
                </div>

                {/* Colonne formulaire (stack en mobile) */}
                <form className="grid gap-3">
                  <label className="text-sm font-medium" htmlFor="email">
                    Recevoir mon lien de démo
                  </label>
                  <div className="flex gap-2 w-full max-sm:flex-col">
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="vous@ecole-ou-agence.com"
                      className="w-full min-w-0 flex-1 focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                    />
                    <Button type="submit" className="max-sm:w-full shrink-0">
                      Envoyer
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-pretty">
                    Nous envoyons un lien de démo et des exemples de plannings.
                    Pas de spam, désinscription en un clic.
                  </p>
                </form>
              </div>
            </CardContent>
          </Card>

          {/* Micro-footer */}
          <div className="mt-8 border-t border-border/60 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-center md:text-left">
            <p className="text-xs text-muted-foreground text-pretty">
              Abonnement payé par le professeur ou l’agence. EUR/USD
              disponibles. Essai gratuit 1 mois sans carte.
            </p>
            <nav className="text-sm">
              <ul className="flex flex-wrap items-center justify-center gap-4">
                <li>
                  <Link href="/legal" className="hover:underline">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </section>
      <div
        role="separator"
        className="mx-auto my-8 md:my-12 h-px w-full max-w-6xl bg-gradient-to-r from-brand/30 via-border to-brand/30"
      />
    </main>
  );
}

export default AskForDemo;
