import {
  Calendar,
  Route,
  MapPin,
  SplitSquareHorizontal,
  Clock,
  TrendingUp,
} from 'lucide-react';

const PropositionValeur = () => {
  const items = [
    {
      icon: <Calendar className="h-6 w-6" aria-hidden="true" />,
      title: 'Optimiser chaque créneau',
      text: 'Un moteur d’affectation qui cale un maximum d’élèves/interventions dans vos plages disponibles.',
    },
    {
      icon: <Route className="h-6 w-6" aria-hidden="true" />,
      title: 'Moins de trajets inutiles',
      text: 'Groupement par zones et enchaînements intelligents pour réduire les kilomètres et la fatigue.',
    },
    {
      icon: <SplitSquareHorizontal className="h-6 w-6" aria-hidden="true" />,
      title: 'Préventif vs curatif (O&M)',
      text: 'Sépare et priorise automatiquement le curatif urgent du préventif planifiable.',
    },
    {
      icon: <MapPin className="h-6 w-6" aria-hidden="true" />,
      title: 'Planification par zones',
      text: 'Crée des journées cohérentes par secteur afin d’éviter les allers-retours et les créneaux perdus.',
    },
    {
      icon: <Clock className="h-6 w-6" aria-hidden="true" />,
      title: 'Intègre vos contraintes réelles',
      text: 'Durées, fenêtres horaires, temps de trajet, indispos… tout est pris en compte, pas de marketplace.',
    },
    {
      icon: <TrendingUp className="h-6 w-6" aria-hidden="true" />,
      title: 'Plus de revenus, clients satisfaits',
      text: 'Moins de temps passé sur la route, plus de créneaux utiles et une expérience plus fiable pour vos clients.',
    },
  ];

  return (
    <section
      id="proposition-valeur"
      aria-label="Proposition de valeur"
      className="relative"
    >
      {/* Fond violet avec léger dégradé */}
      <div className="bg-gradient-to-t from-primary/90 to-primary ">
        <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-white tracking-tight mb-8 md:mb-12">
            Pourquoi choisir notre optimisation d’agendas et de tournées ?
          </h2>

          {/* Grille responsive, sans débordement mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {items.map((card, i) => (
              <article
                key={i}
                className="group rounded-2xl bg-white/95 backdrop-blur p-5 md:p-6 shadow-[0_2px_20px_rgba(0,0,0,0.08)] ring-1 ring-white/30 transition-transform duration-200 hover:-translate-y-[2px]"
              >
                <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-[#6A1B9A]/10 text-[#6A1B9A] mb-3">
                  {card.icon}
                </div>
                <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1.5">
                  {card.title}
                </h3>
                <p className="text-sm md:text-[15px] leading-relaxed text-gray-600">
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PropositionValeur;
