import { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const steps = [
  {
    title: 'Configurez votre espace',
    description:
      'Créez votre compte, définissez vos disponibilités hebdomadaires et vos règles : durée des séances, intercours, cours individuels ou collectifs, etc.',
    color: 'bg-gradient-to-r from-primary to-[#d400ff]',
  },
  {
    title: 'Collectez les disponibilités',
    description:
      'Vos élèves indiquent chaque semaine leurs créneaux possibles via votre code professeur. Le détail reste privé, même pour vous. Ils précisent aussi le nombre d’heures souhaitées et la taille maximale de leur groupe.',
    color: 'bg-gradient-to-r from-primary/95 to-[#d400ff]/95',
  },
  {
    title: 'Planification intelligente et ajustement',
    description:
      'Chaque semaine, le planning se génère automatiquement selon vos règles (heures max par élève, limites quotidiennes, etc.). Vous conservez la main pour le modifier librement avant de le partager.',
    color: 'bg-gradient-to-r from-primary/90 to-[#d400ff]/90',
  },
  {
    title: 'Remplacement automatique des absents',
    description:
      'Les annulations de dernière minute sont gérées en autonomie : rappels automatiques et remplacement immédiat par un élève disponible pour garder un agenda fluide et sans trous.',
    color: 'bg-gradient-to-r from-primary/85 to-[#d400ff]/85',
  },
  {
    title: 'Recommencez chaque semaine',
    description:
      'Chaque semaine, le cycle se renouvelle avec les nouvelles disponibilités et contraintes de vos élèves — sans aucune perte de temps.',
    color: 'bg-gradient-to-r from-primary/80 to-[#d400ff]/80',
  },
];

// const steps = [
//   {
//     title: 'Configurez votre espace',
//     description:
//       'Dimanche soir, Léa ouvre la plateforme : elle crée son compte, règle la durée des séances, ses intercours et choisit individuel ou petit collectif. En quelques minutes, tout est prêt… et la magie peut commencer.',
//     color: 'bg-gradient-to-r from-primary to-[#d400ff]',
//   },
//   {
//     title: 'Collectez les disponibilités',
//     description:
//       'Léa partage son code professeur. Chaque semaine, ses élèves indiquent leurs créneaux possibles — le détail reste privé, même pour elle — ainsi que le nombre d’heures souhaitées et la taille maximale du groupe.',
//     color: 'bg-gradient-to-r from-primary/95 to-[#d400ff]/95',
//   },
//   {
//     title: 'Planification automatique et ajustement',
//     description:
//       'Pendant que Léa dort, le planning s’orchestre tout seul : heures max par élève, limites quotidiennes et buffers respectés. Au réveil, l’emploi du temps est compact et cohérent ; elle ajuste deux cases et le partage d’un clic.',
//     color: 'bg-gradient-to-r from-primary/90 to-[#d400ff]/90',
//   },
//   {
//     title: 'Remplacement automatique des absents',
//     description:
//       'Mercredi, une annulation tombe. Instantanément, un élève disponible reçoit une invitation ; dès qu’il confirme par email, le créneau se remplace tout seul. Rappels envoyés, no-shows évités, sérénité retrouvée.',
//     color: 'bg-gradient-to-r from-primary/85 to-[#d400ff]/85',
//   },
//   {
//     title: 'Recommencez chaque semaine',
//     description:
//       'Chaque semaine, les élèves mettent à jour leurs disponibilités, le planning se régénère, Léa jette un œil et publie. Son agenda reste plein, souple… et l’organisation, presque magique.',
//     color: 'bg-gradient-to-r from-primary/80 to-[#d400ff]/80',
//   },
// ];

const WorkflowCarousel = () => {
  const [windowWidth, setWindowWidth] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const cardsToShow = 3;

  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth); // Définir la largeur de la fenêtre
    }
  }, []);

  const nextStep = () => {
    setCurrentStep(
      (prev) => (prev + 1) % Math.max(steps.length - cardsToShow + 1, 1)
    );
  };

  const prevStep = () => {
    setCurrentStep(
      (prev) =>
        (prev - 1 + Math.max(steps.length - cardsToShow + 1, 1)) %
        Math.max(steps.length - cardsToShow + 1, 1)
    );
  };

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (carouselRef.current) {
        const { scrollLeft } = carouselRef.current;
        const cardWidth =
          (carouselRef.current.firstChild as HTMLElement)?.offsetWidth || 1;
        const newStep = Math.round(scrollLeft / cardWidth);
        setCurrentStep(newStep);
      }
    };

    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (carousel) {
        carousel.removeEventListener('scroll', handleScroll);
      }
    };
  }, [carouselRef]);

  return (
    <section className="relative w-full overflow-hidden py-8 bg-gradient-to-t from-[#f9ffc6]/80 to-[#f9ffc6]/40">
      <div
        role="separator"
        className="mx-auto md:mb-24 h-px w-full max-w-6xl bg-primary max-md:hidden"
      />
      <div className="container mx-auto px-4">
        {/* Titre et Navigation */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Un assistant qui organise vos séances et remplit seul votre agenda
            </h2>
            <p className="text-gray-600 mt-2">
              Offrez à vos élèves la possibilité de faire cours en groupe, ou
              individuellement, pour qu'ils apprennent plus et plus vite.
            </p>
          </div>

          {/* Flèches de navigation (Cachées sur mobile) */}
          <div className="hidden md:flex space-x-4">
            <Button
              onClick={prevStep}
              aria-label="Previous"
              className="p-2 rounded-full bg-primary hover:bg-[#d400ff] transition-colors"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="#d400ff">
                <rect width="30" height="30" rx="15" fill="white" />
                <path
                  d="M16.7167 8.21674L10.2168 14.7167L16.5001 20.9999"
                  stroke="#d400ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
            <Button
              onClick={nextStep}
              aria-label="Next"
              className="p-2 rounded-full bg-primary hover:bg-[#d400ff] transition-colors"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="#d400ff">
                <rect
                  x="30"
                  y="30"
                  width="30"
                  height="30"
                  rx="15"
                  transform="rotate(-180 30 30)"
                  fill="white"
                />
                <path
                  d="M13.2833 21.7833L19.7832 15.2833L13.4999 9.00007"
                  stroke="#d400ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Carrousel */}
        <div className="relative">
          <div
            className="flex md:transition-transform duration-500 ease-in-out max-sm:overflow-x-auto snap-x scroll-smooth scrollbar-hide"
            style={
              windowWidth > 768
                ? {
                    transform:
                      steps.length > cardsToShow
                        ? `translateX(-${currentStep * (100 / cardsToShow)}%)`
                        : 'none',
                  }
                : {}
            }
            ref={carouselRef}
          >
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex-shrink-0 w-full md:w-1/3 px-4 snap-center"
              >
                <div
                  className={`p-6 md:p-8 rounded-lg shadow-lg ${step.color} text-white h-64 flex flex-col relative`}
                >
                  <h3 className="text-xl md:text-2xl font-bold mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base md:text-lg">{step.description}</p>

                  {/* Numéro de l'étape */}
                  <span className="absolute max-sm:bottom-0 md:top-0 right-8 text-[60px] md:text-[80px] font-bold opacity-40">
                    {index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Indicateurs de Progression (puces) */}
        <div className="justify-center mt-6 space-x-2 max-sm:flex hidden">
          {steps.map((_, index) => (
            <span
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === currentStep ? 'bg-primary scale-125' : 'bg-[#d400ff]'
              }`}
            />
          ))}
        </div>

        {/* Section Inspirée */}
        <div className="flex flex-col md:flex-row justify-between items-center mt-12 space-y-4 md:space-y-0 md:space-x-20 bg-white px-6 md:px-8 py-4 rounded-lg shadow-lg border border-gray-200">
          <p className="text-gray-900 text-base md:text-lg text-left">
            Adoptez la magie. <br className=" visible md:hidden" /> Proposer des
            cours collectifs, optimiser vos séances et bien plus encore peut
            transformer votre carrière de manière inattendue.{' '}
            <br className=" visible md:hidden" />
            <br className=" visible md:hidden" />
            Laissez-nous vous le prouver.
          </p>
          <Button
            className="border border-[#d400ff]/40 text-[#d400ff] px-6 py-2 rounded-lg bg-white hover:bg-[#d400ff] hover:text-white transition-colors"
            onClick={() => router.push('/leastory')}
          >
            Découvrez l'histoire de Léa
          </Button>
        </div>
      </div>
      <div
        role="separator"
        className="mx-auto md:mt-24 h-px w-full max-w-6xl bg-primary max-sm:w-[75%] max-sm:mt-22"
      />
    </section>
  );
};

export default WorkflowCarousel;
