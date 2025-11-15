// app/lea/page.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, LogIn } from 'lucide-react';
import Image from 'next/image';

export default function LeaStoryPage() {
  return (
    <main className="min-h-screen bg-[#f9ffc6]/70 text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Fond dégradé + halo doux (moins agressif sur mobile) */}
        <div className="absolute -z- inset-0 bg-gradient-to-b from-primary/90 to-[#d400ff]" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(90%_60%_at_50%_10%,rgba(255,255,255,0.5),transparent)]"
        />

        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16 md:py-20 relative">
          <div className="text-center">
            <span className="inline-block rounded-full bg-white/70 text-black/70 backdrop-blur px-2.5 py-1 text-xs border border-black/10">
              Histoire de Léa
            </span>

            <h1
              className="
                font-display
                mt-3 sm:mt-4 mb-2
                text-[clamp(28px,6vw,48px)]
                leading-[1.1] tracking-tight
                text-white bg-clip-text bg-gradient-to-r from-primary to-[#d400ff]
              "
            >
              Comment Léa a dompté son planning
            </h1>

            <p className="mx-auto max-w-[40ch] sm:max-w-[60ch] text-white text-[15px] sm:text-base leading-relaxed">
              Du chaos des messages au planning qui se remplit presque…
              <span className="text-transparent bg-clip-text bg-black">
                {' '}
                magiquement
              </span>
              .
            </p>

            {/* CTA — full width sur mobile */}
            <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                asChild
                className="w-full rounded-xl bg-white text-primary hover:bg-white/90 px-5 py-3 shadow-sm hover:shadow transition"
              >
                <Link href="/sign-up">
                  Créer mon compte
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full rounded-xl border-black/10 text-black hover:bg-black/5 px-5 py-3"
              >
                <Link href="/sign-in">
                  Se connecter
                  <LogIn className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mini points — chips scrollables sur mobile */}
            <div className="mt-6 -mx-4 overflow-x-auto sm:overflow-visible">
              <ul className="px-4 inline-flex sm:grid sm:grid-cols-3 gap-2 text-sm text-black/70">
                <li className="shrink-0 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-3 py-2">
                  Dispos élèves privées
                </li>
                <li className="shrink-0 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-3 py-2">
                  Planning auto + ajustements
                </li>
                <li className="shrink-0 rounded-xl border border-black/10 bg-white/70 backdrop-blur px-3 py-2">
                  Remplacements instantanés
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE STORY */}
      <section className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {/* Ligne verticale uniquement en md+ pour éviter les collisions mobile */}
        <div className="relative">
          <div
            aria-hidden
            className="hidden md:block absolute left-1/2 -translate-x-px top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-black/10 to-[#d400ff]/40 rounded-full"
          />
          <ol className="space-y-5 sm:space-y-6 md:space-y-10">
            <StoryItem
              index={1}
              title="Configurer son espace (en 3 minutes)"
              color="from-primary to-[#d400ff]"
              text={`Dimanche soir, Léa ouvre la plateforme : elle crée son compte, règle la durée des séances et de ses intercours. Elle renseigne également ses disponibilités. La magie commence.`}
            />
            <StoryItem
              index={2}
              title="Partager un code professeur"
              color="from-primary/95 to-[#d400ff]/95"
              text={`Le lundi, Léa envoie son code. Les élèves saisissent leurs disponibilités hebdomadaires (en toute sérénité car ces informations restent privées), indiquent le nombre d’heures souhaitées et, si besoin, la taille max du groupe.`}
            />
            <StoryItem
              index={3}
              title="Un planning qui se génère… tout seul"
              color="from-primary/90 to-[#d400ff]/90"
              text={`Dans la nuit, le planning se compose automatiquement selon les règles fixées par Léa et ses élèves : heures max par élève, limites quotidiennes, buffers. Léa ajuste deux créneaux, fusionne un mini-groupe, puis partage d’un clic.`}
            />
            <StoryItem
              index={4}
              title="Annulation ? Remplacement instantané"
              color="from-primary/85 to-[#d400ff]/85"
              text={`Mercredi, un élève annule. Le créneau est proposé aux élèves disponibles à cette heure. L’un confirme par email : côté Léa, le créneau apparaît remplacé sans doublon. Grâce à ces rappels, les no-shows sont évités.`}
            />
            <StoryItem
              index={5}
              title="On recommence chaque semaine"
              color="from-primary/80 to-[#d400ff]/80"
              text={`Le dimanche suivant, chacun met à jour ses disponibilités uniquement si elles changent. La ré-orchestration se fait automatiquement. Léa jette un œil, affine si besoin… et publie. Son agenda reste plein, fluide... presque magique.`}
            />
          </ol>
        </div>

        {/* Témoignage — carte compacte avec avatar */}
        <figure className="mt-10 sm:mt-12 md:mt-14 mx-auto max-w-3xl rounded-xl border border-black/10 bg-white/80 backdrop-blur px-4 py-5 sm:px-6 sm:py-6 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <Image
              src="/lea.jpg"
              alt="Photo de profil de Léa"
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-primary/20"
              priority
            />
            <div className="min-w-0">
              <blockquote className="text-black/80 text-[15px] sm:text-base leading-relaxed">
                « J’ai arrêté de courir après les messages et je n’ai plus de
                trous dans mon agenda. Les remplacements se font tout seuls. En
                proposant des cours collectifs par niveau à tarif réduit, j’ai
                pu accueillir plus d’élèves, augmenter mes revenus horaires…
                tout en leur faisant payer moins cher. Désormais, je gagne mieux
                ma vie grâce à mes cours et je peux enfin me concentrer sur ce
                que j’aime vraiment : enseigner. »
              </blockquote>
              <figcaption className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-black/55">
                <span className="font-medium text-black/70">Léa</span>
                <span aria-hidden>·</span>
                <span>Professeure de piano et d’anglais</span>
              </figcaption>
            </div>
          </div>
        </figure>

        {/* CTA bas de page — full width mobile */}
        <div className="mt-8 sm:mt-10 md:mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Button
            asChild
            className="w-full rounded-xl bg-gradient-to-r from-primary to-[#d400ff] text-white px-5 py-3 shadow-sm hover:shadow transition"
          >
            <Link href="/sign-up">
              Essayer 1 mois — sans carte
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full rounded-xl border-black/10 text-black hover:bg-black/5 px-5 py-3"
          >
            <Link href="/sign-in">
              Se connecter
              <LogIn className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-4 bg-transparent w-full border-transparent text-[#d400ff]  px-5 py-3"
        >
          <Link href="/home">Revenir à la page principale</Link>
        </Button>
      </section>
    </main>
  );
}

function StoryItem({
  index,
  title,
  text,
  color,
}: {
  index: number;
  title: string;
  text: string;
  color: string; // ex: "from-primary to-[#d400ff]"
}) {
  return (
    <li
      className="
        relative
        grid grid-cols-[auto,1fr] gap-3
        md:grid-cols-[1fr,3fr] md:gap-8
      "
    >
      {/* Badge index — visible partout, centré en md+ */}
      <div className="flex md:justify-center">
        <span
          className="
            relative h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white border border-black/10 shadow
            flex items-center justify-center text-xs sm:text-sm font-semibold text-black
          "
        >
          <span
            className={`absolute inset-0 rounded-full bg-gradient-to-r ${color} opacity-70 -z-10`}
          />
          {index}
        </span>
      </div>

      {/* Carte */}
      <div className="min-w-0">
        <div className="rounded-xl sm:rounded-2xl border border-black/10 bg-white/85 backdrop-blur p-4 sm:p-5 shadow-sm hover:shadow-md transition">
          <h3 className="font-display text-[18px] sm:text-xl md:text-2xl tracking-tight text-black mb-1.5 sm:mb-2">
            <span
              className={`
                inline-block rounded-md sm:rounded-lg px-2 py-0.5 sm:px-2.5 sm:py-1
                text-[11px] sm:text-xs text-white bg-gradient-to-r ${color} mr-2 align-middle
              `}
            >
              Étape {index}
            </span>
            <span className="align-middle">{title}</span>
          </h3>
          <p className="text-black/75 text-[15px] sm:text-base leading-relaxed">
            {text}
          </p>
        </div>
      </div>
    </li>
  );
}
