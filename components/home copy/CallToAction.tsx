'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type CallToActionProps = {
  title?: string;
  subtitle?: string;
  primaryHref?: string;
  secondaryHref?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  contactEmail?: string;
};

// Au-dessus (dans ton composant)
const subject = encodeURIComponent(
  'Demande de démo — optimisation des tournées'
);
const body = encodeURIComponent(
  [
    'Bonjour Tom,',
    '',
    'Je souhaiterais une démo rapide de l’outil d’optimisation (disponibilités + regroupement par zones).',
    'Créneau idéal : __/__/____ à __:__',
    '',
    'Contexte :',
    '- Nombre d’élèves/clients : ',
    '- Zones couvertes : ',
    '- Outils actuels : ',
    '',
    'Merci !',
  ].join('\n')
);

// Utilitaire (optionnel) si tu veux centraliser
const buildMailto = (email: string, subject: string, body: string) =>
  `mailto:${email}?subject=${subject}&body=${body}`;

const CallToAction: React.FC<CallToActionProps> = ({
  title = 'Optimisez chaque créneau',
  subtitle = 'Moins de trajets, plus de créneaux utiles, des élèves et des clients satisfaits.',
  primaryHref = '/sign-up',
  primaryLabel = 'Tester pendant un mois avant de souscrire',
  secondaryLabel = "J'ai une question ou je veux une démo",
  contactEmail = 'tomabbouz@outlook.com',
}) => {
  return (
    <section id="cta" aria-labelledby="cta-heading" className="relative">
      {/* ⬇️ On ne change pas le background */}
      <div className="bg-gradient-to-b from-primary/90 to-[#d400ff] py-14 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <h2
              id="cta-heading"
              className="text-3xl md:text-4xl font-extrabold tracking-tight text-white"
            >
              {title}
            </h2>

            {subtitle && (
              <p
                className="mt-3 md:mt-4 text-white/85 text-base md:text-lg leading-relaxed"
                aria-describedby="cta-proof"
              >
                {subtitle}
              </p>
            )}

            {/* CTAs */}
            <div className="mt-8 md:mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link href={primaryHref} className="sm:w-auto">
                <Button
                  aria-label={primaryLabel}
                  className={[
                    // bouton jaune primaire
                    'w-full sm:w-auto rounded-xl px-6 py-5 text-base font-semibold',
                    'bg-yellow-400 text-[#6A1B9A]',
                    'hover:bg-primary hover:text-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    'shadow-[0_6px_20px_rgba(0,0,0,0.15)]',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  {primaryLabel}
                </Button>
              </Link>

              <Link
                href={buildMailto(contactEmail, subject, body)}
                className="sm:w-auto"
              >
                <Button
                  aria-label={secondaryLabel}
                  variant="outline"
                  className={[
                    'w-full sm:w-auto rounded-xl px-6 py-5 text-base font-semibold',
                    'border-white/70 text-white',
                    'bg-white/10 hover:border-transparent',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  {secondaryLabel}
                </Button>
              </Link>
            </div>

            {/* Micro-preuves / rassurance */}
            <ul
              id="cta-proof"
              className="mt-6 flex flex-col items-center gap-2 text-white/80 text-sm md:flex-row md:justify-center md:gap-6"
            >
              <li>• Aucune carte requise</li>
              <li>• Annulable en 2 clics</li>
              <li>• Pas de marketplace : vos disponibilités, vos règles</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
