import type { Locale } from '@/src/lib/i18n';

export type BlogImage = {
  alt: string;
  caption?: string;
  height: number;
  src: string;
  width: number;
};

export type BlogSection = {
  bullets?: string[];
  heading: string;
  image?: BlogImage;
  paragraphs: string[];
};

type LocalizedBlogPost = {
  category: string;
  coverImage: BlogImage;
  ctaDescription: string;
  ctaLabel: string;
  ctaTitle: string;
  description: string;
  excerpt: string;
  sections: BlogSection[];
  slug: string;
  tags: string[];
  title: string;
};

type BlogEntry = {
  id: string;
  publishedAt: string;
  readingMinutes: number;
  translations: Record<Locale, LocalizedBlogPost>;
};

export type BlogPost = {
  category: string;
  coverImage: BlogImage;
  ctaDescription: string;
  ctaHref: string;
  ctaLabel: string;
  ctaTitle: string;
  description: string;
  excerpt: string;
  id: string;
  publishedAt: string;
  readingMinutes: number;
  sections: BlogSection[];
  slug: string;
  tags: string[];
  title: string;
};

type BlogUiCopy = {
  articleLabel: string;
  backToBlog: string;
  blog: string;
  blogMetaDescription: string;
  blogMetaTitle: string;
  browseAll: string;
  home: string;
  intro: string;
  listDescription: string;
  listTitle: string;
  moreArticles: string;
  openApp: string;
  readArticle: string;
  readTime: (minutes: number) => string;
  relatedArticles: string;
  signIn: string;
  startFree: string;
  summary: string;
};

const BLOG_ENTRIES: BlogEntry[] = [
  {
    id: 'travel-time-dashboard',
    publishedAt: '2026-04-30',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'track-travel-time-dog-trainer-calendar',
        category: 'Operations',
        title: 'The simple metrics dog trainers should watch before opening more slots',
        description:
          'A practical way to read your calendar through travel time, gaps, and booking density before deciding whether your week can really handle more sessions.',
        excerpt:
          'More available slots do not always mean more revenue. Sometimes the best growth lever is seeing where the week quietly leaks time.',
        tags: ['Metrics', 'Travel', 'Planning'],
        coverImage: {
          src: '/blog/covers/travel-metrics.svg',
          alt: 'Dashboard-style view of travel time, gaps, and session density for a dog trainer',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Turn the calendar into a clearer signal',
        ctaDescription:
          'MagicHango helps dog trainers understand which slots improve the day, not just which slots are technically free.',
        ctaLabel: 'See MagicHango in action',
        sections: [
          {
            heading: 'Start with the time that does not get invoiced',
            paragraphs: [
              'A dog trainer can look busy and still lose a surprising amount of the week between visits. Travel time, parking, early arrivals, late departures, and awkward gaps rarely appear as a single line in the calendar, but together they decide how profitable the week feels.',
              'Before opening more slots, it helps to know how much of the day is actually service time. The answer does not need to be perfect. A rough weekly view is often enough to reveal the patterns that matter.',
            ],
            image: {
              src: '/blog/content/travel-metrics-board.svg',
              alt: 'Simple board comparing service time, travel time, and empty gaps',
              caption: 'A useful dashboard does not need dozens of charts. It needs to show where the week leaks energy.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Watch three numbers before changing availability',
            paragraphs: [
              'The goal is not to turn your business into a spreadsheet. The goal is to notice whether your current availability creates a healthy operating rhythm.',
              'Three numbers are usually enough to begin: travel minutes, gap minutes, and session density by day. Together, they show whether the calendar is compact, scattered, or quietly overloaded.',
            ],
            bullets: [
              'Travel minutes: how much time is spent moving between sessions.',
              'Gap minutes: how much time is too short to use but too long to ignore.',
              'Session density: how many useful appointments fit into a day without rushing.',
            ],
          },
          {
            heading: 'Use the metrics to make smaller adjustments',
            paragraphs: [
              'The best response is often not a dramatic reorganization. A trainer may simply narrow one morning to a specific area, stop offering a low-value time window, or guide clients toward two stronger afternoons.',
              'Small adjustments are easier to maintain, and clients usually accept them better than sudden rule changes. The calendar becomes cleaner without making the business feel less accessible.',
            ],
          },
          {
            heading: 'Better data should make the week calmer',
            paragraphs: [
              'Metrics are useful only if they lead to better decisions. If a dashboard makes you feel guilty for every imperfect day, it is the wrong dashboard.',
              'The right view should help you protect energy, explain availability with confidence, and choose the next slots you open with more intention. That is where tracking becomes operational calm rather than noise.',
            ],
          },
        ],
      },
      fr: {
        slug: 'suivre-temps-trajet-planning-educateur-canin',
        category: 'Organisation',
        title:
          "Les indicateurs simples à suivre avant d'ouvrir plus de créneaux",
        description:
          "Une méthode concrète pour lire son planning à travers les temps de trajet, les trous et la densité de rendez-vous avant de décider si la semaine peut vraiment accueillir plus de séances.",
        excerpt:
          "Plus de créneaux disponibles ne veut pas toujours dire plus de chiffre d'affaires. Parfois, le meilleur levier consiste à voir où la semaine perd discrètement du temps.",
        tags: ['Indicateurs', 'Déplacements', 'Planning'],
        coverImage: {
          src: '/blog/covers/travel-metrics.svg',
          alt: 'Tableau de bord des trajets, trous et séances pour éducateur canin',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Transformer le planning en signal clair',
        ctaDescription:
          'MagicHango aide les éducateurs canins à comprendre quels créneaux améliorent vraiment la journée, pas seulement quels créneaux sont libres.',
        ctaLabel: 'Voir MagicHango en action',
        sections: [
          {
            heading: "Commencer par le temps qui n'est pas facturé",
            paragraphs: [
              "Un éducateur canin peut avoir l'air très occupé tout en perdant une grande partie de sa semaine entre deux visites. Trajets, stationnement, arrivées en avance, départs retardés et trous mal placés n'apparaissent pas toujours clairement dans l'agenda, mais ils déterminent souvent la rentabilité ressentie.",
              "Avant d'ouvrir plus de créneaux, il est utile de savoir quelle part de la journée correspond réellement à du temps de séance. La mesure n'a pas besoin d'être parfaite. Une vue hebdomadaire approximative suffit souvent à révéler les tendances importantes.",
            ],
            image: {
              src: '/blog/content/travel-metrics-board.svg',
              alt: 'Tableau simple comparant temps de séance, temps de trajet et trous',
              caption: "Un bon tableau de bord n'a pas besoin de dizaines de graphiques. Il doit montrer où la semaine perd de l'énergie.",
              width: 1400,
              height: 840,
            },
          },
          {
            heading: "Observer trois chiffres avant de modifier ses disponibilités",
            paragraphs: [
              "L'objectif n'est pas de transformer l'activité en tableur permanent. L'objectif est de savoir si les disponibilités actuelles créent un rythme de travail sain.",
              "Trois chiffres suffisent souvent pour commencer : les minutes de trajet, les minutes de trou et la densité de séances par jour. Ensemble, ils montrent si l'agenda est compact, dispersé ou discrètement surchargé.",
            ],
            bullets: [
              'Minutes de trajet : le temps passé à se déplacer entre deux séances.',
              'Minutes de trou : le temps trop court pour être vraiment utilisé mais trop long pour être ignoré.',
              'Densité de séances : le nombre de rendez-vous utiles qui tiennent dans une journée sans se presser.',
            ],
          },
          {
            heading: 'Utiliser ces indicateurs pour ajuster doucement',
            paragraphs: [
              "La meilleure réponse n'est pas toujours une grande réorganisation. Il suffit parfois de réserver une matinée à une zone précise, de supprimer un créneau peu rentable ou de guider les clients vers deux après-midis plus fluides.",
              "Les petits ajustements sont plus faciles à tenir dans le temps, et les clients les acceptent souvent mieux que des changements de règles soudains. Le planning devient plus propre sans rendre l'activité moins accessible.",
            ],
          },
          {
            heading: 'De meilleures données doivent rendre la semaine plus calme',
            paragraphs: [
              "Les indicateurs ne servent que s'ils aident à prendre de meilleures décisions. Si un tableau de bord vous fait culpabiliser à chaque journée imparfaite, ce n'est pas le bon tableau de bord.",
              "La bonne vue doit aider à protéger son énergie, expliquer ses disponibilités avec plus de confiance et choisir les prochains créneaux à ouvrir avec davantage d'intention. C'est là que le suivi devient un outil de calme opérationnel plutôt qu'un bruit supplémentaire.",
            ],
          },
        ],
      },
    },
  },
  {
    id: 'client-booking-handoff',
    publishedAt: '2026-04-24',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'client-self-booking-vs-trainer-booking',
        category: 'Booking',
        title: 'When should clients book themselves, and when should you book for them?',
        description:
          'A practical guide for dog trainers who want the speed of self-booking without losing the personal touch when a client needs help choosing the right session.',
        excerpt:
          'Self-booking works best when the path is obvious. Trainer-assisted booking works best when context matters more than speed.',
        tags: ['Booking', 'Client experience', 'Operations'],
        coverImage: {
          src: '/blog/covers/client-booking-flow.svg',
          alt: 'Split booking flow showing a client self-booking and a trainer booking for a client',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep booking simple without losing control',
        ctaDescription:
          'MagicHango helps trainers guide clients toward better slots while keeping the booking journey clear and flexible.',
        ctaLabel: 'Explore MagicHango',
        sections: [
          {
            heading: 'Self-booking is strongest when the decision is simple',
            paragraphs: [
              'Many clients are perfectly happy to book without calling or messaging first. If they know the service they need, understand the location, and can choose from a small set of good options, self-booking removes friction for everyone.',
              'The mistake is to make self-booking look like a huge calendar with every possible slot. A clear shortlist usually performs better: it lowers hesitation and gently guides the client toward times that also make sense for your route.',
            ],
            image: {
              src: '/blog/content/booking-handoff.svg',
              alt: 'Decision map for choosing between self-booking and trainer-assisted booking',
              caption: 'The best booking flow is not always the most automated one. It is the one that fits the client context.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Book for the client when context changes the answer',
            paragraphs: [
              'Some bookings need more judgment. A first session with a reactive dog, a family with unusual constraints, a follow-up after a difficult appointment, or a client who is not comfortable with digital tools may need a more guided path.',
              'In those cases, booking on behalf of the client is not a step backward. It is a service gesture. The important part is that the booking still lands in the same system, with the same confirmations, reminders, and calendar visibility.',
            ],
            bullets: [
              'Use self-booking for repeat clients and straightforward services.',
              'Use trainer-assisted booking for sensitive first sessions or complex travel choices.',
              'Keep the notification flow identical so the client receives the same confirmation either way.',
            ],
          },
          {
            heading: 'The handoff should feel invisible',
            paragraphs: [
              'A client should not have to understand whether a booking was created by them or by you. What matters is that the time, service, address, and next steps are clear.',
              'That means the trainer-assisted path should reuse the same booking rules as the client path. Same buffers, same availability logic, same email tone. The admin shortcut should not create a separate reality.',
            ],
          },
          {
            heading: 'A mixed model gives you better control',
            paragraphs: [
              'The most sustainable setup is rarely fully manual or fully automated. Let clients handle the obvious bookings, then step in when your expertise genuinely improves the choice.',
              'This protects your time without making the experience cold. It also helps you keep the calendar cleaner, because every booking still passes through the same operational frame.',
            ],
          },
        ],
      },
      fr: {
        slug: 'reservation-client-ou-educateur-canin',
        category: 'Réservation',
        title:
          'Quand laisser le client réserver seul, et quand réserver à sa place ?',
        description:
          "Un guide concret pour les éducateurs canins qui veulent gagner du temps avec la réservation autonome sans perdre l'accompagnement humain quand le client a besoin d'aide.",
        excerpt:
          "La réservation autonome fonctionne quand le choix est évident. La réservation accompagnée fonctionne quand le contexte compte plus que la vitesse.",
        tags: ['Réservation', 'Expérience client', 'Organisation'],
        coverImage: {
          src: '/blog/covers/client-booking-flow.svg',
          alt: 'Parcours de réservation partagé entre client et éducateur canin',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Simplifier la réservation sans perdre le contrôle',
        ctaDescription:
          'MagicHango aide les éducateurs à guider les clients vers de meilleurs créneaux tout en gardant un parcours clair et flexible.',
        ctaLabel: 'Découvrir MagicHango',
        sections: [
          {
            heading: 'La réservation autonome marche quand la décision est simple',
            paragraphs: [
              "Beaucoup de clients sont très contents de réserver sans appeler ni envoyer de message. S'ils savent de quel service ils ont besoin, comprennent le lieu du rendez-vous et voient quelques bons créneaux, la réservation autonome enlève de la friction pour tout le monde.",
              "L'erreur consiste à transformer cette autonomie en grand calendrier rempli de possibilités. Une sélection courte fonctionne souvent mieux : elle réduit l'hésitation et oriente naturellement le client vers des horaires qui restent cohérents avec votre tournée.",
            ],
            image: {
              src: '/blog/content/booking-handoff.svg',
              alt: 'Carte de décision entre réservation autonome et réservation accompagnée',
              caption: "Le meilleur parcours de réservation n'est pas toujours le plus automatisé. C'est celui qui correspond au contexte du client.",
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Réserver pour le client quand le contexte change la réponse',
            paragraphs: [
              "Certaines réservations demandent davantage de jugement. Une première séance avec un chien réactif, une famille avec des contraintes particulières, un suivi après une séance difficile ou un client peu à l'aise avec le numérique peuvent nécessiter un parcours plus guidé.",
              "Dans ces cas-là, réserver à la place du client n'est pas un retour en arrière. C'est un geste de service. Le point important est que la réservation arrive tout de même dans le même système, avec les mêmes confirmations, les mêmes rappels et la même visibilité dans l'agenda.",
            ],
            bullets: [
              'Utiliser la réservation autonome pour les clients réguliers et les services simples.',
              'Utiliser la réservation accompagnée pour les premières séances sensibles ou les choix de trajet complexes.',
              'Garder le même flux de notifications afin que le client reçoive la même confirmation dans les deux cas.',
            ],
          },
          {
            heading: 'Le passage de relais doit être invisible',
            paragraphs: [
              "Le client n'a pas besoin de savoir si la réservation a été créée par lui ou par vous. Ce qui compte, c'est que l'horaire, le service, l'adresse et les prochaines étapes soient clairs.",
              "Cela veut dire que le parcours côté éducateur doit réutiliser les mêmes règles que le parcours client : mêmes marges de déplacement, même logique de disponibilité, même ton dans les emails. Le raccourci administratif ne doit pas créer une réalité séparée.",
            ],
          },
          {
            heading: 'Un modèle mixte donne plus de maîtrise',
            paragraphs: [
              "Le système le plus durable est rarement entièrement manuel ou entièrement automatisé. Laissez les clients gérer les réservations évidentes, puis intervenez lorsque votre expertise améliore réellement le choix.",
              "Vous protégez ainsi votre temps sans rendre l'expérience froide. Et vous gardez un agenda plus propre, car chaque réservation passe malgré tout par le même cadre opérationnel.",
            ],
          },
        ],
      },
    },
  },
  {
    id: 'weekly-planning',
    publishedAt: '2026-04-10',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-trainer-weekly-planning',
        category: 'Planning',
        title: 'How dog trainers can plan a week without wasting half a day on the road',
        description:
          'A practical framework to cluster sessions, protect energy, and keep your week readable without making clients feel squeezed into your calendar.',
        excerpt:
          'A better week starts with fewer zigzags, clearer travel buffers, and a calmer booking experience for clients.',
        tags: ['Planning', 'Travel', 'Operations'],
        coverImage: {
          src: '/blog/covers/weekly-planning.svg',
          alt: 'Stylized weekly route planning board for a dog trainer',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Build a calmer week',
        ctaDescription:
          'MagicHango helps dog trainers surface the most fluid slots first and keep bookings easy to understand for clients.',
        ctaLabel: 'Explore MagicHango',
        sections: [
          {
            heading: 'Start with travel reality, not ideal availability',
            paragraphs: [
              'Many dog trainers begin by opening every theoretically free hour in the week. The result looks generous on paper, but it often creates scattered bookings and long travel gaps.',
              'A stronger approach is to begin with the shape of your real field days: where you usually work, how far you are willing to drive, and which parts of the day are the most stable. Once that frame exists, availability becomes easier to protect.',
            ],
            image: {
              src: '/blog/content/route-clusters.svg',
              alt: 'Abstract route clusters showing a tighter weekly schedule',
              caption: 'Grouping nearby sessions early changes the whole shape of the week.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Create anchors before adding flexibility',
            paragraphs: [
              'Think in anchors rather than isolated appointments. One morning can be anchored around a neighborhood, one afternoon around a repeat route, and one evening around lighter follow-ups.',
              'Clients still need flexibility, but flexibility works better when it grows around stable anchors. It reduces last-minute reshuffling and makes your week easier to read at a glance.',
            ],
            bullets: [
              'Reserve one or two areas per day whenever possible.',
              'Keep short buffers between nearby sessions instead of huge empty gaps.',
              'Leave at least one recovery block in the week for admin and overruns.',
            ],
          },
          {
            heading: 'Use recommendation, not pressure',
            paragraphs: [
              'If you want clients to choose the most efficient slots, show a shortlist first. Two to four suggested times are usually enough to guide behavior without making the system feel manipulative.',
              'The key is to explain the recommendation in human language. “Fits well in the day” or “Helps keep the visit smoother” works better than anything that sounds like scoring or optimization jargon.',
            ],
          },
          {
            heading: 'A readable week protects service quality',
            paragraphs: [
              'When travel is under control, trainers arrive with more focus, better punctuality, and more emotional bandwidth. Clients feel that difference immediately.',
              'In other words, a well-planned week is not only an internal operations win. It is part of the service experience, and it often becomes visible in retention and word of mouth.',
            ],
          },
        ],
      },
      fr: {
        slug: 'planifier-semaine-educateur-canin',
        category: 'Planning',
        title:
          'Comment un éducateur canin peut planifier sa semaine sans perdre sa journée sur la route',
        description:
          "Un cadre concret pour regrouper les séances, préserver son énergie et garder un planning lisible sans donner au client l'impression d'être coincé dans un agenda rigide.",
        excerpt:
          'Une meilleure semaine commence souvent avec moins de zigzags, des marges de trajet plus claires et une réservation plus sereine côté client.',
        tags: ['Planning', 'Déplacements', 'Organisation'],
        coverImage: {
          src: '/blog/covers/weekly-planning.svg',
          alt: 'Tableau de planification hebdomadaire pour éducateur canin',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Construire une semaine plus fluide',
        ctaDescription:
          'MagicHango aide les éducateurs canins à mettre en avant les créneaux les plus fluides tout en gardant une expérience simple pour les clients.',
        ctaLabel: 'Découvrir MagicHango',
        sections: [
          {
            heading: 'Partir de la réalité terrain, pas de la disponibilité idéale',
            paragraphs: [
              "Beaucoup d'éducateurs commencent par ouvrir toutes les heures libres possibles. Sur le papier, cela semble généreux, mais cela produit souvent un agenda dispersé et des temps de trajet inutiles.",
              "Une approche plus solide consiste à partir de la forme réelle des journées : les zones dans lesquelles vous intervenez, la distance que vous acceptez de parcourir et les moments de la journée les plus stables. Une fois ce cadre posé, il devient beaucoup plus simple de protéger ses disponibilités.",
            ],
            image: {
              src: '/blog/content/route-clusters.svg',
              alt: 'Illustration de créneaux regroupés sur une même zone',
              caption: 'Regrouper les séances proches transforme souvent toute la semaine.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Créer des points d’ancrage avant d’ajouter de la flexibilité',
            paragraphs: [
              "Il est utile de penser en blocs d'ancrage plutôt qu'en rendez-vous isolés. Une matinée peut être structurée autour d'un quartier, un après-midi autour d'une tournée récurrente, une fin de journée autour de suivis plus légers.",
              "Les clients ont toujours besoin de souplesse, mais cette souplesse fonctionne mieux lorsqu'elle s'organise autour de points stables. Cela réduit les réajustements de dernière minute et rend la semaine beaucoup plus lisible.",
            ],
            bullets: [
              'Réserver si possible une ou deux zones par jour.',
              'Prévoir de petits tampons entre deux séances proches plutôt que de grands trous.',
              'Garder au moins un bloc de respiration dans la semaine pour l’administratif et les imprévus.',
            ],
          },
          {
            heading: 'Guider sans mettre de pression',
            paragraphs: [
              'Si vous voulez orienter les clients vers les créneaux les plus efficaces, une shortlist fonctionne très bien. Deux à quatre propositions suffisent souvent pour guider le choix sans donner une impression de manipulation.',
              'Le plus important est d’expliquer la recommandation avec des mots humains. “S’intègre bien au planning” ou “rend la visite plus fluide” fonctionne mieux qu’un vocabulaire trop technique ou trop algorithmique.',
            ],
          },
          {
            heading: 'Une semaine lisible améliore aussi la qualité de service',
            paragraphs: [
              "Quand les déplacements sont mieux maîtrisés, l'éducateur arrive avec plus de concentration, davantage de ponctualité et plus de disponibilité mentale. Le client perçoit cette différence immédiatement.",
              "Autrement dit, un planning bien construit n'est pas seulement un gain d'organisation interne. C'est aussi une composante directe de l'expérience client et, souvent, de la fidélisation.",
            ],
          },
        ],
      },
    },
  },
  {
    id: 'first-session-communication',
    publishedAt: '2026-03-28',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'prepare-first-dog-training-session',
        category: 'Client experience',
        title: 'What to send before a first dog training session to reduce stress for everyone',
        description:
          'A simple communication checklist that helps clients arrive ready, reduces no-shows, and makes the first session feel calm from the start.',
        excerpt:
          'The first appointment often feels smoother when clients know what to expect, what to prepare, and how the visit will unfold.',
        tags: ['Communication', 'First session', 'Client experience'],
        coverImage: {
          src: '/blog/covers/first-session.svg',
          alt: 'Warm onboarding illustration for a first dog training session',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Give clients a calmer first impression',
        ctaDescription:
          'Booking is not just about choosing a time. It is also about setting the tone before the visit begins.',
        ctaLabel: 'See how MagicHango helps',
        sections: [
          {
            heading: 'Reduce uncertainty before it becomes friction',
            paragraphs: [
              'A lot of first-session anxiety comes from silence. Clients do not know what to prepare, whether the dog should have eaten, whether family members need to be present, or how long the visit will actually last.',
              'A short message sent at the right moment answers those questions before they become stress. It also prevents avoidable back-and-forth on the day of the appointment.',
            ],
            image: {
              src: '/blog/content/first-visit-checklist.svg',
              alt: 'Checklist card for a first dog training visit',
              caption: 'A short checklist reassures better than a long, administrative email.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Keep the message short, warm, and specific',
            paragraphs: [
              'A good pre-visit message should feel reassuring, not administrative. Clients need enough detail to feel ready, but not so much detail that they skim past the important parts.',
            ],
            bullets: [
              'Remind them of the date, local time, and duration.',
              'Confirm the exact address or meeting instructions.',
              'Explain in one line what to prepare: leash, treats, notes, household context.',
              'Add one sentence that lowers pressure: “You do not need to have everything perfect before we meet.”',
            ],
          },
          {
            heading: 'Use reminders to protect both attendance and trust',
            paragraphs: [
              'A reminder email twenty-four to forty-eight hours before the session is often enough to cut forgetfulness without feeling intrusive.',
              'The reminder becomes even more useful if it includes the practical details people usually search for at the last minute: time, address, name of the trainer, and a clear contact path in case something changes.',
            ],
          },
          {
            heading: 'The best onboarding feels calm, not automated',
            paragraphs: [
              'Even when the process is automated, the tone should stay human. Clients should feel guided, not processed.',
              'That is why short, well-written messages often outperform long templates. The goal is not to prove thoroughness. The goal is to make the upcoming visit feel simple and under control.',
            ],
          },
        ],
      },
      fr: {
        slug: 'preparer-premiere-seance-education-canine',
        category: 'Expérience client',
        title:
          'Que faut-il envoyer avant une première séance pour réduire le stress de tout le monde',
        description:
          'Une checklist de communication simple pour préparer les clients, réduire les oublis et rendre la première séance plus calme dès le départ.',
        excerpt:
          "Le premier rendez-vous se passe souvent mieux quand le client sait à quoi s'attendre, quoi préparer et comment la visite va se dérouler.",
        tags: ['Communication', 'Première séance', 'Expérience client'],
        coverImage: {
          src: '/blog/covers/first-session.svg',
          alt: 'Illustration chaleureuse pour une première séance canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Donner une première impression plus sereine',
        ctaDescription:
          'La réservation ne consiste pas seulement à choisir une heure. Elle permet aussi de poser une ambiance avant même la visite.',
        ctaLabel: 'Voir comment MagicHango aide',
        sections: [
          {
            heading: 'Réduire l’incertitude avant qu’elle ne crée de la friction',
            paragraphs: [
              "Beaucoup de stress autour d'une première séance vient simplement du manque d'informations. Le client ne sait pas quoi préparer, s'il faut que le chien ait mangé, si toute la famille doit être présente ou combien de temps la visite va réellement durer.",
              "Un message court envoyé au bon moment répond à ces questions avant qu'elles ne deviennent une source de tension. Cela évite aussi des échanges de dernière minute le jour du rendez-vous.",
            ],
            image: {
              src: '/blog/content/first-visit-checklist.svg',
              alt: 'Carte checklist avant une première visite éducative',
              caption: 'Une checklist courte rassure souvent mieux qu’un long bloc de texte.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Rester court, chaleureux et concret',
            paragraphs: [
              "Un bon message avant la visite doit rassurer sans avoir un ton administratif. Le client a besoin d'assez de détails pour se sentir prêt, mais pas au point de survoler l'essentiel.",
            ],
            bullets: [
              'Rappeler la date, l’heure locale et la durée.',
              'Confirmer l’adresse exacte ou les consignes de rendez-vous.',
              'Expliquer en une ligne quoi préparer : laisse, friandises, notes, contexte du foyer.',
              'Ajouter une phrase qui baisse la pression : “Vous n’avez pas besoin que tout soit parfait avant notre rencontre.”',
            ],
          },
          {
            heading: 'Les rappels protègent autant la présence que la confiance',
            paragraphs: [
              "Un email de rappel envoyé vingt-quatre à quarante-huit heures avant la séance suffit souvent à réduire les oublis sans donner une impression d'insistance.",
              "Le rappel devient encore plus utile lorsqu'il reprend les détails pratiques que l'on cherche souvent au dernier moment : l'heure, l'adresse, le nom de l'éducateur et un moyen clair de contacter quelqu'un si un imprévu survient.",
            ],
          },
          {
            heading: 'Le meilleur onboarding reste humain, même automatisé',
            paragraphs: [
              "Même si le parcours est automatisé, le ton doit rester humain. Le client doit se sentir accompagné, pas traité comme un dossier.",
              "C'est pour cela que des messages courts et bien rédigés fonctionnent souvent mieux que de longs modèles. L'objectif n'est pas de prouver que l'on a tout prévu. L'objectif est de rendre la visite à venir simple et maîtrisée.",
            ],
          },
        ],
      },
    },
  },
  {
    id: 'reduce-no-shows',
    publishedAt: '2026-03-12',
    readingMinutes: 7,
    translations: {
      en: {
        slug: 'reduce-no-shows-dog-training',
        category: 'Operations',
        title: 'How to reduce no-shows and last-minute cancellations without sounding rigid',
        description:
          'A practical way to combine reminders, clear cancellation windows, and a calmer booking flow so clients understand the rules before problems happen.',
        excerpt:
          'Firm rules work better when they feel predictable, visible, and fair from the moment the booking is made.',
        tags: ['Reminders', 'Cancellations', 'Operations'],
        coverImage: {
          src: '/blog/covers/no-shows.svg',
          alt: 'Booking rules and reminders illustration for dog training sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make booking rules feel clearer',
        ctaDescription:
          'A smoother booking experience can lower late surprises without turning your process into a wall of policies.',
        ctaLabel: 'Start with MagicHango',
        sections: [
          {
            heading: 'The problem often starts at booking time',
            paragraphs: [
              'Late cancellations rarely happen only because clients are careless. They also happen when the cancellation rule was not visible enough, or when practical details stayed fuzzy until the last minute.',
              'If someone books in two clicks but only discovers the real constraints later, the frustration shows up much closer to the appointment.',
            ],
          },
          {
            heading: 'Show the rule early, then repeat it calmly',
            paragraphs: [
              'The cancellation window should be visible before confirmation, repeated in the confirmation email, and restated in the reminder. The wording should stay factual and steady each time.',
              'That consistency matters. When a client sees the same rule in the same tone at every step, it feels like a stable system rather than a penalty invented after the fact.',
            ],
            bullets: [
              'Display the rule near the booking confirmation button.',
              'Include it in the confirmation email in one short sentence.',
              'Repeat it in the reminder when the visit is approaching.',
            ],
            image: {
              src: '/blog/content/cancellation-rules.svg',
              alt: 'Structured cancellation rules card with reminder timeline',
              caption: 'Rules feel fairer when they are visible before the booking is confirmed.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Give clients the details they need to keep the appointment',
            paragraphs: [
              'A reminder is not only there to say “do not forget.” It should also remove the last sources of hesitation.',
              'The most useful reminders include the session time, the full address, the trainer name, and a direct way to make contact if something changes. The clearer the reminder, the less likely the client is to disappear in uncertainty.',
            ],
          },
          {
            heading: 'A fair system feels structured, not severe',
            paragraphs: [
              'Clients accept rules more easily when the process feels transparent. That is why visual clarity matters as much as policy text.',
              'If the booking flow is calm, readable, and explicit from the beginning, people are less likely to feel trapped. In practice, that often leads to fewer disputes and better attendance.',
            ],
          },
        ],
      },
      fr: {
        slug: 'reduire-absences-rendez-vous-education-canine',
        category: 'Organisation',
        title:
          'Comment réduire les annulations de dernière minute sans donner une impression de rigidité',
        description:
          'Une méthode simple pour combiner rappels, règles d’annulation claires et parcours de réservation plus lisible afin que le client comprenne les règles avant que les problèmes arrivent.',
        excerpt:
          'Les règles fermes fonctionnent mieux lorsqu’elles paraissent prévisibles, visibles et équitables dès la réservation.',
        tags: ['Rappels', 'Annulations', 'Organisation'],
        coverImage: {
          src: '/blog/covers/no-shows.svg',
          alt: 'Illustration de rappels et règles de réservation',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les règles plus claires',
        ctaDescription:
          'Une réservation plus lisible aide à limiter les mauvaises surprises sans transformer le parcours en mur de conditions.',
        ctaLabel: 'Commencer avec MagicHango',
        sections: [
          {
            heading: 'Le problème naît souvent dès la réservation',
            paragraphs: [
              'Les annulations tardives ne viennent pas uniquement d’un manque de sérieux côté client. Elles apparaissent aussi lorsque la règle d’annulation est peu visible ou lorsque les détails pratiques restent flous jusqu’au dernier moment.',
              'Si quelqu’un réserve en deux clics mais découvre ensuite les vraies contraintes, la frustration se manifeste très près du rendez-vous.',
            ],
          },
          {
            heading: 'Afficher la règle tôt, puis la répéter calmement',
            paragraphs: [
              'La fenêtre d’annulation doit être visible avant la confirmation, rappelée dans l’email de confirmation, puis répétée dans le rappel avant la séance. Le ton doit rester factuel et stable à chaque étape.',
              'Cette cohérence compte beaucoup. Lorsqu’un client voit la même règle, formulée de la même manière, à chaque moment du parcours, elle ressemble à un système clair plutôt qu’à une sanction improvisée après coup.',
            ],
            bullets: [
              'Afficher la règle près du bouton de confirmation.',
              'La rappeler dans l’email de confirmation en une phrase courte.',
              'La répéter dans le rappel à l’approche du rendez-vous.',
            ],
            image: {
              src: '/blog/content/cancellation-rules.svg',
              alt: 'Carte visuelle des règles d’annulation et du rappel',
              caption: 'Une règle paraît plus juste lorsqu’elle est visible bien avant le rendez-vous.',
              width: 1400,
              height: 840,
            },
          },
          {
            heading: 'Donner les détails qui aident vraiment à honorer le rendez-vous',
            paragraphs: [
              "Un rappel ne sert pas seulement à dire “n'oubliez pas”. Il doit aussi enlever les dernières zones d'hésitation.",
              "Les rappels les plus utiles comprennent l'heure, l'adresse complète, le nom de l'éducateur et un moyen direct de contacter quelqu'un en cas d'imprévu. Plus le rappel est clair, moins le client risque de disparaître dans l'incertitude.",
            ],
          },
          {
            heading: 'Un système juste paraît structuré, pas sévère',
            paragraphs: [
              "Les clients acceptent plus facilement des règles lorsque le parcours semble transparent. C'est pour cela que la clarté visuelle compte autant que le texte des politiques.",
              "Si la réservation est calme, lisible et explicite dès le départ, les gens ont moins l'impression d'être piégés. En pratique, cela réduit souvent les contestations et améliore la présence.",
            ],
          },
        ],
      },
    },
  },
];

export function getBlogUiCopy(locale: Locale): BlogUiCopy {
  const isFrench = locale === 'fr';

  return {
    articleLabel: isFrench ? 'Article' : 'Article',
    backToBlog: isFrench ? 'Retour au blog' : 'Back to blog',
    blog: 'Blog',
    blogMetaDescription: isFrench
      ? 'Articles et conseils réguliers pour les éducateurs canins qui veulent mieux organiser leurs réservations et leur relation client.'
      : 'Regular articles and practical advice for dog trainers who want a calmer booking flow and better day-to-day operations.',
    blogMetaTitle: isFrench ? 'Blog pour éducateurs canins' : 'Blog for dog trainers',
    browseAll: isFrench ? 'Voir tous les articles' : 'Browse all posts',
    home: isFrench ? 'Accueil' : 'Home',
    intro: isFrench
      ? 'Des articles concrets pour améliorer la réservation, l’organisation et l’expérience client côté éducateur canin.'
      : 'Practical writing on booking, operations, and client experience for modern dog trainers.',
    listDescription: isFrench
      ? 'Publier régulièrement des idées utiles, lisibles et directement actionnables.'
      : 'A small editorial space for useful, readable, and actionable ideas.',
    listTitle: isFrench ? 'Le blog MagicHango' : 'The MagicHango blog',
    moreArticles: isFrench ? 'À lire ensuite' : 'Read next',
    openApp: isFrench ? "Ouvrir l'app" : 'Open app',
    readArticle: isFrench ? "Lire l'article" : 'Read article',
    readTime: (minutes) =>
      isFrench ? `${minutes} min de lecture` : `${minutes} min read`,
    relatedArticles: isFrench ? 'Articles liés' : 'Related articles',
    signIn: isFrench ? 'Connexion' : 'Sign in',
    startFree: isFrench ? 'Essayer gratuitement' : 'Try for free',
    summary: isFrench ? 'Sommaire' : 'Summary',
  };
}

function sortEntriesByDateDesc(entries: BlogEntry[]) {
  return [...entries].sort((left, right) =>
    right.publishedAt.localeCompare(left.publishedAt),
  );
}

function toBlogPost(entry: BlogEntry, locale: Locale): BlogPost {
  const translation = entry.translations[locale];

  return {
    id: entry.id,
    slug: translation.slug,
    category: translation.category,
    title: translation.title,
    description: translation.description,
    excerpt: translation.excerpt,
    tags: translation.tags,
    coverImage: translation.coverImage,
    publishedAt: entry.publishedAt,
    readingMinutes: entry.readingMinutes,
    sections: translation.sections,
    ctaTitle: translation.ctaTitle,
    ctaDescription: translation.ctaDescription,
    ctaLabel: translation.ctaLabel,
    ctaHref: `/${locale}/sign-up`,
  };
}

export function getAllBlogPosts(locale: Locale): BlogPost[] {
  return sortEntriesByDateDesc(BLOG_ENTRIES).map((entry) => toBlogPost(entry, locale));
}

export function getBlogPostBySlug(locale: Locale, slug: string): BlogPost | null {
  const entry = BLOG_ENTRIES.find(
    (current) => current.translations[locale].slug === slug,
  );

  return entry ? toBlogPost(entry, locale) : null;
}

export function getRelatedBlogPosts(
  locale: Locale,
  currentPostId: string,
  count = 2,
): BlogPost[] {
  return getAllBlogPosts(locale)
    .filter((post) => post.id !== currentPostId)
    .slice(0, count);
}

export function getBlogStaticParams() {
  return BLOG_ENTRIES.flatMap((entry) => [
    { locale: 'en', slug: entry.translations.en.slug },
    { locale: 'fr', slug: entry.translations.fr.slug },
  ]);
}

export function formatBlogDate(locale: Locale, publishedAt: string) {
  return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${publishedAt}T12:00:00Z`));
}
