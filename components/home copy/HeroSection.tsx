'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Poppins } from 'next/font/google';
import { Sparkles } from 'lucide-react';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
});

const HeroSection: React.FC = () => {
  return (
    <section
      className="
      text-black
        relative overflow-hidden
        bg-gradient-to-b from-[#f9ffc6]/80 via-brand to-[#f9ffc6]/40
        pt-24
      "
    >
      <div
        aria-hidden
        className="
          pointer-events-none absolute inset-0
          [mask-image:radial-gradient(60%_60%_at_50%_30%,black,transparent)]
          bg-white/5
        "
      />

      <div className="container mx-auto px-4 pb-10 md:pb-20 md:px-6 text-center relative">
        {/* Titre mobile (avec logo) */}
        <h1 className="md:hidden text-3xl font-extrabold text-black mb-4 md:mb-6">
          <div>La réservation pro qui remplit votre agenda.</div>
        </h1>
        {/* Titre desktop */}
        <h1
          className={`
    ${poppins.className}
    max-sm:hidden
    text-4xl md:text-5xl
    font-black tracking-tight leading-tight
    text-black
    mb-4 md:mb-6
  `}
        >
          La plateforme dédiée aux{' '}
          <span className="decoration-brand/30 underline-offset-4 text-primary">
            tuteurs
          </span>{' '}
          et{' '}
          <span className="decoration-brand/30 underline-offset-4 text-primary">
            agences
          </span>
          , {/* Bloc nom + icône alignés */}
          <span className="inline-flex items-center gap-2 align-baseline whitespace-nowrap">
            <span className="bg-gradient-to-r from-primary to-[#d400ff] bg-clip-text text-transparent">
              MagicHango
            </span>
            <Sparkles
              aria-hidden
              className="h-[0.75em] w-[0.75em] text-[#d400ff] relative top-[-17px] left-[-10px] motion-safe:animate-pulse"
            />
          </span>
        </h1>
        <h2
          className={`
          ${poppins.className}
          max-sm:hidden
          text-2xl md:text-3xl
          font-semibold tracking-tight leading-tight
          text-black/90
          mb-4 md:mb-6
        `}
        >
          Remplissez chaque créneau et développez votre base d’élèves{' '}
          <span className="text-brand font-semibold">en un clin d'œil</span>
        </h2>
        <span className="mt-12 mb-12 inline-block align-baseline">
          <Image
            src="/IconeSansFond.png"
            alt="Logo"
            width={200}
            height={200}
            className="md:w-[200px] md:h-[200px]"
          />
        </span>
        {/* CTA — deux boutons simples */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Button
            asChild
            className="
              px-6 md:px-8 py-3 text-base md:text-lg font-semibold
              bg-primary text-brand hover:bg-primary/90
              rounded-2xl shadow-lg hover:shadow-xl transition
            "
          >
            <Link className="text-white" href="/sign-up">
              Créer mon compte - en 1 minute
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="
              px-6 md:px-8 py-3 text-base md:text-lg font-semibold
              bg-white text-primary border-primary/60 hover:bg-[#d400ff] hover:text-white
              rounded-2xl backdrop-blur-sm
            "
          >
            <Link href="/sign-in" className="text-primary">
              Me connecter
            </Link>
          </Button>
        </div>
        {/* <p className="mt-3 text-base md:text-xl text-black/90 leading-normal md:leading-relaxed max-w-3xl mx-auto">
          Les élèves indiquent leurs disponibilités{' '}
          <strong className="text-brand">chaque semaine</strong>, vous validez…
          et nous plaçons automatiquement les cours pour{' '}
          <strong className="text-brand">combler les trous</strong>.
        </p>

        <p className="text-base md:text-xl text-black/90 mb-8 md:mb-10 leading-normal md:leading-relaxed max-w-3xl mx-auto">
          Pas de paiement côté élèves&nbsp;: seuls les professeurs/agences
          s’abonnent. En cas d’annulation, un élève disponible est proposé{' '}
          <strong className="text-brand">instantanément</strong>
          et le créneau est remplacé après sa confirmation par email.
        </p> */}
        {/* Points clés */}
        {/* <ul className="mt-6 md:mt-8 grid gap-2 text-black/80 text-sm md:text-base max-w-3xl mx-auto">
          <li>
            • Page de réservation professionnelle (élèves : disponibilités
            hebdo)
          </li>
          <li>
            • Priorisation intelligente pour remplir les créneaux « orphelins »
          </li>
          <li>• Buffers entre cours pour garder un rythme réaliste</li>
          <li>
            • Multi-prof disponible (rôles&nbsp;: admin d’agence, prof,
            étudiant)
          </li>
          <li>• Essai 1&nbsp;mois sans carte • Abonnements EUR/USD (Stripe)</li>
        </ul> */}
      </div>
    </section>
  );
};

export default HeroSection;
