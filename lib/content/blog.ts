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
    id: 'referral-client-onboarding',
    publishedAt: '2026-05-17',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'dog-training-referral-client-onboarding',
        category: 'Client experience',
        title: 'How to onboard a new client who comes from a referral',
        description:
          'A practical way to welcome referred dog training clients while still collecting the right context and setting clear expectations.',
        excerpt:
          'A referral creates trust before the first message. The onboarding still needs structure so the new client starts with the right information.',
        tags: ['Referrals', 'Onboarding', 'Client experience'],
        coverImage: {
          src: '/blog/covers/referral-onboarding.svg',
          alt: 'Referral onboarding flow connecting an existing client to a new dog training client',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Turn referrals into clearer bookings',
        ctaDescription:
          'MagicHango helps trainers keep intake, booking, and follow-up organized even when clients arrive through word of mouth.',
        ctaLabel: 'Organize referral bookings',
        sections: [
          {
            heading: 'A referral is warm, but it is still a new client',
            paragraphs: [
              'When a new client comes through a recommendation, the relationship often starts with more trust. That is valuable, but it can also make the trainer skip steps that are still important.',
              'The new client needs the same clarity as anyone else: service fit, address, dog context, pricing, booking rules, and what happens next.',
            ],
          },
          {
            heading: 'Acknowledge the connection without assuming the need',
            paragraphs: [
              'It is helpful to mention the referral source, but the trainer should still ask the right questions. Two clients can know each other and have completely different dogs, constraints, and expectations.',
              'A short intake keeps the warm start while protecting the quality of the first session.',
            ],
            bullets: [
              'Thank the client for reaching out through the recommendation.',
              'Ask what prompted them to book now.',
              'Collect the same safety and address details as usual.',
              'Avoid promising the same format before understanding the case.',
            ],
          },
          {
            heading: 'Keep the booking path consistent',
            paragraphs: [
              'Referrals can become messy when they happen entirely through messages. The trainer may forget to send a policy, miss an address detail, or offer a slot that does not fit the route.',
              'Putting referred clients through the same booking path keeps the experience professional without making it feel impersonal.',
            ],
          },
          {
            heading: 'Close the loop with the referrer when appropriate',
            paragraphs: [
              'If the original client made the introduction directly, a short thank-you can reinforce the relationship. Keep it discreet and never share private details about the new client.',
              'This makes referrals feel appreciated while preserving professional boundaries.',
            ],
          },
        ],
      },
      fr: {
        slug: 'accueillir-client-recommande-education-canine',
        category: 'Experience client',
        title: 'Comment accueillir un nouveau client venu par recommandation',
        description:
          'Une methode pratique pour accueillir les clients recommandes tout en collectant le bon contexte et en posant des attentes claires.',
        excerpt:
          'Une recommandation cree de la confiance avant le premier message. L onboarding doit quand meme rester structure pour bien commencer.',
        tags: ['Recommandation', 'Onboarding', 'Experience client'],
        coverImage: {
          src: '/blog/covers/referral-onboarding.svg',
          alt: 'Parcours de recommandation reliant un client existant a un nouveau client',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Transformer les recommandations en reservations claires',
        ctaDescription:
          'MagicHango aide les educateurs a garder intake, reservation et suivi organises meme lorsque les clients arrivent par bouche-a-oreille.',
        ctaLabel: 'Organiser les recommandations',
        sections: [
          {
            heading: 'Une recommandation est chaleureuse, mais reste un nouveau client',
            paragraphs: [
              'Quand un nouveau client arrive par recommandation, la relation commence souvent avec plus de confiance. C est précieux, mais cela peut aussi pousser l educateur a sauter des etapes importantes.',
              'Le nouveau client a besoin de la meme clarte que les autres : service adapte, adresse, contexte du chien, tarif, regles de reservation et prochaines etapes.',
            ],
          },
          {
            heading: 'Reconnaître le lien sans supposer le besoin',
            paragraphs: [
              'Il est utile de mentionner la personne qui recommande, mais il faut quand meme poser les bonnes questions. Deux clients peuvent se connaitre tout en ayant des chiens, contraintes et attentes tres differentes.',
              'Un court intake garde le depart chaleureux tout en protegeant la qualite de la premiere seance.',
            ],
            bullets: [
              'Remercier le client d etre venu par recommandation.',
              'Demander ce qui le pousse a reserver maintenant.',
              'Collecter les memes details de securite et d adresse que d habitude.',
              'Eviter de promettre le meme format avant de comprendre le cas.',
            ],
          },
          {
            heading: 'Garder un parcours de reservation coherent',
            paragraphs: [
              'Les recommandations peuvent devenir floues lorsqu elles se passent uniquement par messages. L educateur peut oublier une regle, manquer un detail d adresse ou proposer un creneau incoherent avec la tournee.',
              'Faire passer les clients recommandes par le meme parcours de reservation garde une experience professionnelle sans la rendre froide.',
            ],
          },
          {
            heading: 'Boucler avec la personne qui recommande si pertinent',
            paragraphs: [
              'Si le client initial a fait l introduction directement, un court merci peut renforcer la relation. Restez discret et ne partagez jamais de details prives sur le nouveau client.',
              'La recommandation est ainsi valorisee tout en gardant des limites professionnelles.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'repeated-cancellations',
    publishedAt: '2026-05-17',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'repeated-cancellations-dog-training-clients',
        category: 'Operations',
        title: 'How to handle clients who cancel repeatedly',
        description:
          'A calm framework for dog trainers to distinguish occasional life events from patterns that hurt capacity and client progress.',
        excerpt:
          'Repeated cancellations need a different response from a single emergency. The goal is to protect the calendar without turning the relationship cold.',
        tags: ['Cancellations', 'Policies', 'Planning'],
        coverImage: {
          src: '/blog/covers/repeated-cancellations.svg',
          alt: 'Repeated cancellation cards with clear policy markers',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Protect capacity without losing clarity',
        ctaDescription:
          'MagicHango helps trainers keep booking rules and reminders visible before cancellation patterns become stressful.',
        ctaLabel: 'Clarify cancellation rules',
        sections: [
          {
            heading: 'One cancellation is not a pattern',
            paragraphs: [
              'Clients have real life events. A single cancellation does not need to become a conflict. The problem starts when cancellations become frequent enough to affect progress, income, and route planning.',
              'Naming the pattern early helps keep the conversation practical instead of emotional.',
            ],
          },
          {
            heading: 'Separate empathy from availability',
            paragraphs: [
              'You can understand the client situation and still protect your calendar. Those two things do not contradict each other.',
              'A calm policy makes it easier to stay kind while explaining what needs to change before more sessions are booked.',
            ],
            bullets: [
              'Track how often sessions are cancelled or moved.',
              'Remind the client of the booking rule before applying a consequence.',
              'Offer a different rhythm if the current one is unrealistic.',
              'Pause future bookings if the pattern continues.',
            ],
          },
          {
            heading: 'Use a reset conversation',
            paragraphs: [
              'After repeated cancellations, a short reset message can help: confirm whether the client still wants to continue, ask what rhythm is realistic, and explain how future bookings will be handled.',
              'This gives the client a chance to re-engage without pretending the pattern is invisible.',
            ],
          },
          {
            heading: 'Protect progress as well as revenue',
            paragraphs: [
              'Frequent cancellations do not only affect the trainer schedule. They also slow the dog progress and can make the client feel like training is not working.',
              'Framing the conversation around progress often feels more constructive than focusing only on lost time.',
            ],
          },
        ],
      },
      fr: {
        slug: 'annulations-repetees-clients-education-canine',
        category: 'Organisation',
        title: 'Comment gerer les clients qui annulent trop souvent',
        description:
          'Un cadre calme pour distinguer les imprevus ponctuels des habitudes qui abiment la capacite et la progression du client.',
        excerpt:
          'Les annulations repetees demandent une autre reponse qu une urgence ponctuelle. L objectif est de proteger le planning sans refroidir la relation.',
        tags: ['Annulations', 'Regles', 'Planning'],
        coverImage: {
          src: '/blog/covers/repeated-cancellations.svg',
          alt: 'Cartes d annulations repetees avec marqueurs de regles claires',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Proteger la capacite sans perdre la clarte',
        ctaDescription:
          'MagicHango aide les educateurs a rendre regles de reservation et rappels visibles avant que les annulations deviennent stressantes.',
        ctaLabel: 'Clarifier les annulations',
        sections: [
          {
            heading: 'Une annulation ne fait pas une habitude',
            paragraphs: [
              'Les clients ont de vrais imprevus. Une seule annulation ne doit pas devenir un conflit. Le probleme commence lorsque les annulations deviennent assez frequentes pour toucher la progression, le revenu et la tournee.',
              'Nommer la tendance tot permet de garder une conversation pratique plutot qu emotionnelle.',
            ],
          },
          {
            heading: 'Separer empathie et disponibilite',
            paragraphs: [
              'Vous pouvez comprendre la situation du client tout en protegeant votre planning. Les deux ne sont pas contradictoires.',
              'Une regle calme aide a rester bienveillant tout en expliquant ce qui doit changer avant de reserver davantage.',
            ],
            bullets: [
              'Suivre la frequence des annulations ou reports.',
              'Rappeler la regle avant d appliquer une consequence.',
              'Proposer un autre rythme si le rythme actuel est irrealiste.',
              'Mettre les prochaines reservations en pause si la tendance continue.',
            ],
          },
          {
            heading: 'Utiliser une conversation de remise a plat',
            paragraphs: [
              'Apres plusieurs annulations, un court message de remise a plat peut aider : confirmer si le client souhaite continuer, demander quel rythme est realiste et expliquer comment les prochaines reservations seront gerees.',
              'Cela donne au client une chance de se reengager sans faire comme si la tendance etait invisible.',
            ],
          },
          {
            heading: 'Proteger les progres autant que le revenu',
            paragraphs: [
              'Les annulations frequentes ne touchent pas seulement le planning. Elles ralentissent aussi les progres du chien et peuvent donner au client l impression que le travail ne fonctionne pas.',
              'Cadrer la discussion autour des progres parait souvent plus constructif que de parler uniquement du temps perdu.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'progress-review-session',
    publishedAt: '2026-05-17',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'dog-training-progress-review-session',
        category: 'Planning',
        title: 'How to run a progress review session with a dog training client',
        description:
          'A practical structure for reviewing progress, deciding what changes next, and turning scattered observations into a clear follow-up plan.',
        excerpt:
          'Progress reviews help clients see what changed, what still needs work, and why the next step matters.',
        tags: ['Progress', 'Follow-up', 'Client experience'],
        coverImage: {
          src: '/blog/covers/progress-review.svg',
          alt: 'Progress review chart for dog training follow-up sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make progress easier to follow',
        ctaDescription:
          'MagicHango helps trainers keep sessions, follow-ups, and client context connected over time.',
        ctaLabel: 'Plan progress reviews',
        sections: [
          {
            heading: 'Clients need to see progress, not only feel it',
            paragraphs: [
              'Dog training progress can be uneven. Some weeks feel better, others reveal new situations. A review session helps the client understand what has actually changed and what still needs support.',
              'This is especially useful after several sessions, before renewing a package, or when the client confidence drops.',
            ],
          },
          {
            heading: 'Review the original goal first',
            paragraphs: [
              'Start with the reason the client booked in the first place. Then compare that starting point with what happens today.',
              'This keeps the conversation grounded and prevents the review from becoming a loose list of complaints.',
            ],
            bullets: [
              'What was the original concern?',
              'What situations are easier now?',
              'What still creates stress?',
              'What changed in the client routine?',
              'Which next step would create the most value?',
            ],
          },
          {
            heading: 'Separate training progress from management progress',
            paragraphs: [
              'Sometimes the dog behavior has changed. Sometimes the family has become better at preventing difficult situations. Both are progress, but they lead to different next steps.',
              'Naming the difference helps clients understand why some routines still matter even when things feel better.',
            ],
          },
          {
            heading: 'End with a short plan',
            paragraphs: [
              'A review should finish with a clear plan: what to continue, what to adjust, and when to check again.',
              'The client leaves with a sense of direction instead of a vague feeling that more training may be needed.',
            ],
          },
        ],
      },
      fr: {
        slug: 'bilan-progression-education-canine',
        category: 'Planning',
        title: 'Comment mener un bilan de progression avec un client',
        description:
          'Une structure pratique pour relire les progres, decider de la suite et transformer les observations dispersees en plan clair.',
        excerpt:
          'Un bilan aide le client a voir ce qui a change, ce qui reste a travailler et pourquoi la prochaine etape compte.',
        tags: ['Progres', 'Suivi', 'Experience client'],
        coverImage: {
          src: '/blog/covers/progress-review.svg',
          alt: 'Graphique de progression pour bilan de suivi en education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les progres plus faciles a suivre',
        ctaDescription:
          'MagicHango aide les educateurs a garder seances, suivis et contexte client connectes dans le temps.',
        ctaLabel: 'Planifier les bilans',
        sections: [
          {
            heading: 'Les clients ont besoin de voir les progres',
            paragraphs: [
              'Les progres en education canine ne sont pas toujours lineaires. Certaines semaines semblent meilleures, d autres revelent de nouvelles situations. Un bilan aide le client a comprendre ce qui a vraiment change et ce qui demande encore du soutien.',
              'C est particulierement utile apres plusieurs seances, avant de renouveler un forfait ou lorsque la confiance du client baisse.',
            ],
          },
          {
            heading: 'Repartir de l objectif initial',
            paragraphs: [
              'Commencez par la raison pour laquelle le client a reserve au depart. Comparez ensuite ce point de depart avec ce qui se passe aujourd hui.',
              'Cela garde la conversation ancree et evite que le bilan devienne une liste vague de problemes.',
            ],
            bullets: [
              'Quel etait le sujet initial ?',
              'Quelles situations sont plus simples maintenant ?',
              'Qu est-ce qui cree encore du stress ?',
              'Qu est-ce qui a change dans la routine du client ?',
              'Quelle prochaine etape apporterait le plus de valeur ?',
            ],
          },
          {
            heading: 'Distinguer progres d apprentissage et progres de gestion',
            paragraphs: [
              'Parfois le comportement du chien a change. Parfois la famille gere mieux les situations difficiles. Les deux sont des progres, mais ils ne menent pas aux memes prochaines etapes.',
              'Nommer cette difference aide le client a comprendre pourquoi certaines routines restent importantes meme quand tout semble aller mieux.',
            ],
          },
          {
            heading: 'Terminer par un plan court',
            paragraphs: [
              'Un bilan doit finir avec un plan clair : quoi continuer, quoi ajuster et quand refaire le point.',
              'Le client repart avec une direction concrete plutot qu avec l impression vague qu il faudrait peut-etre encore travailler.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'multi-dog-household',
    publishedAt: '2026-05-17',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'multi-dog-household-training-session',
        category: 'Client experience',
        title: 'How to prepare a session for a household with multiple dogs',
        description:
          'A practical framework for dog trainers when several dogs live in the same home and the session needs structure before it starts.',
        excerpt:
          'Multi-dog homes need more preparation than a standard visit. The session works better when roles, spaces, and priorities are clear.',
        tags: ['Multi-dog', 'Preparation', 'Client experience'],
        coverImage: {
          src: '/blog/covers/multi-dog-household.svg',
          alt: 'Three cards showing grouped dogs in a multi-dog household training plan',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Prepare complex households with clarity',
        ctaDescription:
          'MagicHango helps trainers keep client context and practical session details visible before the appointment.',
        ctaLabel: 'Prepare complex sessions',
        sections: [
          {
            heading: 'Multi-dog sessions need a plan before arrival',
            paragraphs: [
              'When several dogs live in the same home, the first minutes can become noisy and unclear very quickly. The trainer may need to observe interactions, separate dogs, or focus on one priority before working with the group.',
              'A little preparation before the visit helps the client understand that not every dog needs to be involved at the same time.',
            ],
          },
          {
            heading: 'Ask which dog is the priority',
            paragraphs: [
              'Clients often describe the household as one problem, but the session usually needs a starting point. One dog may trigger the others, one may need management, or one may simply be the easiest entry into the work.',
              'Choosing a priority does not ignore the other dogs. It gives the appointment enough structure to begin well.',
            ],
            bullets: [
              'Which dog is the main concern today?',
              'Which dog changes the energy of the room most quickly?',
              'Can the dogs be separated safely if needed?',
              'Who in the household handles each dog most often?',
            ],
          },
          {
            heading: 'Prepare spaces and transitions',
            paragraphs: [
              'Multi-dog work often depends on doors, rooms, baby gates, crates, gardens, or leashes. If those options are not ready, the session can lose time before the training begins.',
              'A preparation message can ask the client to make separation options available without making the home feel judged.',
            ],
          },
          {
            heading: 'End with a realistic next step',
            paragraphs: [
              'A single session may not solve every household dynamic. It should leave the client with a clear first routine and a plan for which dog or situation comes next.',
              'That makes the work feel progressive instead of overwhelming.',
            ],
          },
        ],
      },
      fr: {
        slug: 'seance-foyer-plusieurs-chiens-education-canine',
        category: 'Experience client',
        title: 'Comment preparer une seance dans un foyer avec plusieurs chiens',
        description:
          'Un cadre pratique pour les educateurs canins lorsqu il y a plusieurs chiens dans le meme foyer et que la seance doit etre structuree avant de commencer.',
        excerpt:
          'Les foyers avec plusieurs chiens demandent plus de preparation qu une visite classique. La seance fonctionne mieux lorsque roles, espaces et priorites sont clairs.',
        tags: ['Plusieurs chiens', 'Preparation', 'Experience client'],
        coverImage: {
          src: '/blog/covers/multi-dog-household.svg',
          alt: 'Trois cartes montrant des chiens regroupes dans un plan de seance multi-chiens',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Preparer les foyers complexes avec clarte',
        ctaDescription:
          'MagicHango aide les educateurs a garder contexte client et details pratiques visibles avant le rendez-vous.',
        ctaLabel: 'Preparer les seances complexes',
        sections: [
          {
            heading: 'Les seances multi-chiens demandent un plan avant l arrivee',
            paragraphs: [
              'Quand plusieurs chiens vivent dans le meme foyer, les premieres minutes peuvent devenir bruyantes et floues tres vite. L educateur peut devoir observer les interactions, separer les chiens ou travailler une priorite avant le groupe.',
              'Un peu de preparation avant la visite aide le client a comprendre que tous les chiens n ont pas besoin de participer en meme temps.',
            ],
          },
          {
            heading: 'Demander quel chien est prioritaire',
            paragraphs: [
              'Les clients decrivent souvent le foyer comme un seul probleme, mais la seance a besoin d un point de depart. Un chien peut declencher les autres, un autre demander de la gestion, ou un autre offrir l entree la plus simple dans le travail.',
              'Choisir une priorite ne revient pas a ignorer les autres chiens. Cela donne assez de structure au rendez-vous pour bien commencer.',
            ],
            bullets: [
              'Quel chien est le sujet principal aujourd hui ?',
              'Quel chien change le plus vite l energie de la piece ?',
              'Les chiens peuvent-ils etre separes en securite si besoin ?',
              'Qui gere le plus souvent chaque chien dans le foyer ?',
            ],
          },
          {
            heading: 'Preparer les espaces et les transitions',
            paragraphs: [
              'Le travail avec plusieurs chiens depend souvent des portes, pieces, barrieres, caisses, jardin ou laisses. Si ces options ne sont pas pretes, la seance perd du temps avant meme de commencer.',
              'Un message de preparation peut demander au client de rendre ces options disponibles sans donner l impression de juger le logement.',
            ],
          },
          {
            heading: 'Terminer avec une prochaine etape realiste',
            paragraphs: [
              'Une seule seance ne resout pas toujours toute la dynamique du foyer. Elle doit laisser au client une premiere routine claire et un plan pour le chien ou la situation suivante.',
              'Le travail parait alors progressif au lieu d etre ecrasant.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'late-client-policy',
    publishedAt: '2026-05-16',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'handle-late-clients-dog-training',
        category: 'Booking',
        title: 'How to handle late clients without making the relationship tense',
        description:
          'A practical way to set late-arrival rules for dog training appointments while keeping the client relationship calm and fair.',
        excerpt:
          'Late arrivals are easier to handle when the rule is visible before anyone is late.',
        tags: ['Booking', 'Policies', 'Client experience'],
        coverImage: {
          src: '/blog/covers/late-clients.svg',
          alt: 'Clock and booking policy cards for late dog training clients',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make time rules easier to apply',
        ctaDescription:
          'MagicHango helps trainers make booking expectations visible in confirmations and reminders.',
        ctaLabel: 'Clarify appointment rules',
        sections: [
          {
            heading: 'Late arrivals affect more than one session',
            paragraphs: [
              'A client who arrives ten or fifteen minutes late may not realize that the delay can affect the next appointment, travel time, or the trainer ability to finish notes calmly.',
              'That is why late-arrival rules should be framed as a way to protect the whole day, not as a punishment.',
            ],
          },
          {
            heading: 'Write the rule before you need it',
            paragraphs: [
              'A late policy feels harsher when it appears after the client is already late. It feels fairer when it is visible in the booking flow and repeated in the reminder.',
              'The wording can stay simple and human.',
            ],
            bullets: [
              'Explain when the session still ends at the planned time.',
              'Clarify when a session may need to be rescheduled.',
              'Include the best contact method if the client is delayed.',
              'Keep the same rule in confirmations and reminders.',
            ],
          },
          {
            heading: 'Decide what can be adapted',
            paragraphs: [
              'Some delays can be absorbed. Others cannot. A short local follow-up may tolerate a few minutes, while a first session before a long route may need stricter boundaries.',
              'Having rules does not remove judgment. It gives judgment a stable frame.',
            ],
          },
          {
            heading: 'Keep the tone steady',
            paragraphs: [
              'The best late policy sounds practical, not irritated. Clients should understand the constraint without feeling attacked.',
              'A calm tone makes the rule easier to apply when the situation actually happens.',
            ],
          },
        ],
      },
      fr: {
        slug: 'gerer-retards-clients-education-canine',
        category: 'Reservation',
        title: 'Comment gerer les retards clients sans tendre la relation',
        description:
          'Une methode pratique pour poser des regles de retard en education canine tout en gardant une relation client calme et juste.',
        excerpt:
          'Les retards sont plus faciles a gerer lorsque la regle est visible avant que quelqu un soit en retard.',
        tags: ['Reservation', 'Regles', 'Experience client'],
        coverImage: {
          src: '/blog/covers/late-clients.svg',
          alt: 'Horloge et cartes de regles de reservation pour les retards clients',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les regles horaires plus faciles a appliquer',
        ctaDescription:
          'MagicHango aide les educateurs a rendre les attentes de reservation visibles dans les confirmations et rappels.',
        ctaLabel: 'Clarifier les regles de rendez-vous',
        sections: [
          {
            heading: 'Un retard touche plus qu une seule seance',
            paragraphs: [
              'Un client qui arrive avec dix ou quinze minutes de retard ne voit pas toujours que cela peut toucher le rendez-vous suivant, le trajet ou la capacite de l educateur a finir ses notes calmement.',
              'C est pourquoi les regles de retard doivent etre presentees comme une protection de toute la journee, pas comme une sanction.',
            ],
          },
          {
            heading: 'Ecrire la regle avant d en avoir besoin',
            paragraphs: [
              'Une regle de retard parait plus dure lorsqu elle apparait apres le retard. Elle parait plus juste lorsqu elle est visible dans le parcours de reservation et repetee dans le rappel.',
              'La formulation peut rester simple et humaine.',
            ],
            bullets: [
              'Expliquer quand la seance se termine quand meme a l heure prevue.',
              'Clarifier quand une seance peut devoir etre reportee.',
              'Indiquer le meilleur moyen de contact en cas de retard.',
              'Garder la meme regle dans les confirmations et rappels.',
            ],
          },
          {
            heading: 'Decider ce qui peut etre adapte',
            paragraphs: [
              'Certains retards peuvent etre absorbes. D autres non. Un suivi local court peut tolerer quelques minutes, tandis qu une premiere seance avant une longue tournee demande plus de limites.',
              'Avoir des regles ne retire pas le jugement. Cela lui donne un cadre stable.',
            ],
          },
          {
            heading: 'Garder un ton stable',
            paragraphs: [
              'La meilleure regle de retard sonne pratique, pas agacee. Les clients doivent comprendre la contrainte sans se sentir attaques.',
              'Un ton calme rend la regle plus facile a appliquer lorsque la situation arrive vraiment.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'prepaid-session-expiry',
    publishedAt: '2026-05-15',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'prepaid-dog-training-session-expiry',
        category: 'Operations',
        title: 'Should prepaid dog training sessions have an expiry date?',
        description:
          'A practical guide to setting fair expiry rules for prepaid sessions so clients stay motivated and trainers protect capacity.',
        excerpt:
          'Expiry rules can feel fair when they protect planning, keep progress moving, and are explained before payment.',
        tags: ['Packages', 'Policies', 'Planning'],
        coverImage: {
          src: '/blog/covers/prepaid-expiry.svg',
          alt: 'Prepaid dog training session cards with confirmed expiry milestones',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep prepaid sessions easier to track',
        ctaDescription:
          'MagicHango helps trainers structure packages, follow-ups, and booking expectations more clearly.',
        ctaLabel: 'Organize prepaid sessions',
        sections: [
          {
            heading: 'Expiry dates are about planning, not pressure',
            paragraphs: [
              'A prepaid package without any timing rule can drift for months. The client loses momentum, the trainer carries unfinished capacity, and the training goal becomes harder to maintain.',
              'An expiry date can be fair when it is explained as a way to keep progress active and the schedule predictable.',
            ],
          },
          {
            heading: 'Choose a rule that matches the package',
            paragraphs: [
              'A short puppy package may need a tighter window than a flexible maintenance plan. The rule should support the training goal rather than copy a generic business policy.',
              'Clients accept timing rules more easily when they understand why the rhythm matters.',
            ],
            bullets: [
              'Short goal-focused package: tighter expiry window.',
              'Longer behavior plan: wider window with planned milestones.',
              'Maintenance sessions: flexible but reviewed regularly.',
              'Medical or family exceptions: clear approval path.',
            ],
          },
          {
            heading: 'Make the rule visible before payment',
            paragraphs: [
              'The expiry rule should not appear after the client has paid. Put it near the package description, in the confirmation, and in follow-up reminders.',
              'Visibility prevents surprise and makes the package feel more professional.',
            ],
          },
          {
            heading: 'Send reminders before sessions expire',
            paragraphs: [
              'A fair expiry rule should include a reminder before the deadline. The goal is not to catch clients out. The goal is to help them use what they purchased.',
              'A simple reminder can recover progress and reduce awkward conversations later.',
            ],
          },
        ],
      },
      fr: {
        slug: 'expiration-seances-prepayees-education-canine',
        category: 'Organisation',
        title: 'Faut-il mettre une date d expiration aux seances prepayees',
        description:
          'Un guide pratique pour poser des regles justes sur les seances prepayees afin de garder les clients motives et de proteger la capacite.',
        excerpt:
          'Une date d expiration peut etre juste lorsqu elle protege le planning, maintient les progres et est expliquee avant le paiement.',
        tags: ['Forfaits', 'Regles', 'Planning'],
        coverImage: {
          src: '/blog/covers/prepaid-expiry.svg',
          alt: 'Cartes de seances prepayees avec jalons d expiration confirmes',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Mieux suivre les seances prepayees',
        ctaDescription:
          'MagicHango aide les educateurs a structurer forfaits, suivis et attentes de reservation plus clairement.',
        ctaLabel: 'Organiser les seances prepayees',
        sections: [
          {
            heading: 'Une expiration sert le planning, pas la pression',
            paragraphs: [
              'Un forfait prepaye sans regle de temps peut trainer pendant des mois. Le client perd son elan, l educateur garde une capacite inachevee et l objectif devient plus difficile a maintenir.',
              'Une date d expiration peut etre juste lorsqu elle est expliquee comme un moyen de garder les progres actifs et le planning previsible.',
            ],
          },
          {
            heading: 'Choisir une regle adaptee au forfait',
            paragraphs: [
              'Un petit forfait chiot peut demander une fenetre plus courte qu un suivi d entretien flexible. La regle doit soutenir l objectif d education, pas copier une politique generique.',
              'Les clients acceptent mieux les regles de temps lorsqu ils comprennent pourquoi le rythme compte.',
            ],
            bullets: [
              'Forfait court et cible : fenetre d expiration plus serree.',
              'Plan comportemental plus long : fenetre plus large avec jalons prevus.',
              'Seances d entretien : souplesse avec revue reguliere.',
              'Exceptions medicales ou familiales : chemin d approbation clair.',
            ],
          },
          {
            heading: 'Rendre la regle visible avant le paiement',
            paragraphs: [
              'La regle d expiration ne doit pas apparaitre apres le paiement. Placez-la pres de la description du forfait, dans la confirmation et dans les rappels de suivi.',
              'Cette visibilite evite la surprise et rend le forfait plus professionnel.',
            ],
          },
          {
            heading: 'Envoyer un rappel avant expiration',
            paragraphs: [
              'Une regle juste doit inclure un rappel avant la date limite. L objectif n est pas de pieger les clients. L objectif est de les aider a utiliser ce qu ils ont achete.',
              'Un simple rappel peut relancer les progres et reduire les conversations inconfortables plus tard.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'outdoor-session-prep',
    publishedAt: '2026-05-14',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'prepare-outdoor-dog-training-session',
        category: 'Client experience',
        title: 'How to prepare clients for an outdoor dog training session',
        description:
          'A practical checklist for meeting points, equipment, distractions, weather, and expectations before an outdoor training appointment.',
        excerpt:
          'Outdoor sessions work best when the client knows where to meet, what to bring, and how much unpredictability is normal.',
        tags: ['Outdoor', 'Preparation', 'Client experience'],
        coverImage: {
          src: '/blog/covers/outdoor-session.svg',
          alt: 'Outdoor dog training route with meeting points and preparation markers',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make outdoor sessions easier to run',
        ctaDescription:
          'MagicHango helps trainers keep meeting points, reminders, and booking details clear before the session.',
        ctaLabel: 'Prepare outdoor bookings',
        sections: [
          {
            heading: 'Outdoor sessions need more context than indoor sessions',
            paragraphs: [
              'A park, street, or shared outdoor space can change quickly. Other dogs, traffic, weather, noise, and parking all affect the quality of the session.',
              'A clear preparation message helps the client arrive ready instead of spending the first ten minutes solving practical issues.',
            ],
          },
          {
            heading: 'Confirm the meeting point precisely',
            paragraphs: [
              'A vague location creates stress before the work begins. Clients need the exact meeting point, parking guidance, and what to do if they arrive early or cannot find the trainer.',
              'This is especially important in large parks, residential areas, or places with multiple entrances.',
            ],
            bullets: [
              'Send the exact meeting address or map point.',
              'Explain where to park or wait.',
              'Tell the client whether the dog should stay in the car, on leash, or at a distance.',
              'Include a simple contact path for last-minute location issues.',
            ],
          },
          {
            heading: 'Set expectations about distractions',
            paragraphs: [
              'Clients may expect an outdoor session to look clean and controlled from the start. It helps to explain that part of the work is observing and adjusting to the environment.',
              'That framing lowers pressure and makes the session feel more purposeful when distractions appear.',
            ],
          },
          {
            heading: 'Prepare a weather fallback',
            paragraphs: [
              'Outdoor sessions should have a simple fallback rule. Light rain, heat, storms, or unsafe ground conditions can all affect whether the session should move, shorten, or reschedule.',
              'When the rule is known before the appointment, weather decisions feel less improvised.',
            ],
          },
        ],
      },
      fr: {
        slug: 'preparer-seance-exterieur-education-canine',
        category: 'Experience client',
        title: 'Comment preparer les clients avant une seance en exterieur',
        description:
          'Une checklist pratique pour clarifier lieu de rendez-vous, materiel, distractions, meteo et attentes avant une seance dehors.',
        excerpt:
          'Une seance en exterieur se passe mieux lorsque le client sait ou aller, quoi apporter et quelle part d imprevisible est normale.',
        tags: ['Exterieur', 'Preparation', 'Experience client'],
        coverImage: {
          src: '/blog/covers/outdoor-session.svg',
          alt: 'Parcours de seance en exterieur avec points de rendez-vous',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les seances dehors plus simples',
        ctaDescription:
          'MagicHango aide les educateurs a garder lieux de rendez-vous, rappels et details de reservation clairs avant la seance.',
        ctaLabel: 'Preparer les reservations exterieures',
        sections: [
          {
            heading: 'Les seances dehors demandent plus de contexte',
            paragraphs: [
              'Un parc, une rue ou un espace partage peut changer rapidement. Autres chiens, circulation, meteo, bruit et stationnement influencent la qualite de la seance.',
              'Un message de preparation clair aide le client a arriver pret au lieu de passer les dix premieres minutes a regler des details pratiques.',
            ],
          },
          {
            heading: 'Confirmer precisement le point de rendez-vous',
            paragraphs: [
              'Un lieu vague cree du stress avant meme de commencer. Les clients ont besoin du point exact, des consignes de stationnement et de savoir quoi faire s ils arrivent en avance ou ne trouvent pas l educateur.',
              'C est encore plus important dans les grands parcs, les zones residentielles ou les lieux avec plusieurs entrees.',
            ],
            bullets: [
              'Envoyer l adresse exacte ou le point sur la carte.',
              'Expliquer ou se garer ou attendre.',
              'Dire si le chien doit rester en voiture, en laisse ou a distance.',
              'Inclure un moyen simple de contact en cas de souci de lieu.',
            ],
          },
          {
            heading: 'Poser les attentes sur les distractions',
            paragraphs: [
              'Les clients peuvent imaginer qu une seance dehors doit etre propre et controlee des le debut. Il est utile d expliquer qu une partie du travail consiste justement a observer et ajuster selon l environnement.',
              'Ce cadrage baisse la pression et rend la seance plus logique lorsque les distractions apparaissent.',
            ],
          },
          {
            heading: 'Prevoir une solution meteo',
            paragraphs: [
              'Les seances dehors ont besoin d une regle simple en cas de meteo. Petite pluie, chaleur, orage ou sol dangereux peuvent demander de deplacer, raccourcir ou reporter.',
              'Lorsque la regle est connue avant le rendez-vous, la decision semble moins improvisee.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'weather-rescheduling',
    publishedAt: '2026-04-26',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'weather-rescheduling-dog-training',
        category: 'Operations',
        title: 'How to handle weather rescheduling without confusing clients',
        description:
          'A practical framework for outdoor dog training sessions when rain, heat, storms, or unsafe conditions affect the appointment.',
        excerpt:
          'Weather rules are easier to accept when they are visible before the forecast becomes a problem.',
        tags: ['Weather', 'Rescheduling', 'Operations'],
        coverImage: {
          src: '/blog/covers/weather-rescheduling.svg',
          alt: 'Weather rescheduling checklist for outdoor dog training appointments',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep rescheduling rules clear',
        ctaDescription:
          'MagicHango helps trainers keep booking rules, reminders, and client communication aligned.',
        ctaLabel: 'Clarify rescheduling',
        sections: [
          {
            heading: 'Weather decisions should not be invented at the last minute',
            paragraphs: [
              'Outdoor training depends on real conditions. Rain may be workable, heat may be unsafe, and storms may make a session impossible. If the rule is unclear, every forecast becomes a negotiation.',
              'A simple weather policy keeps the decision professional and easier for clients to understand.',
            ],
          },
          {
            heading: 'Define what changes the plan',
            paragraphs: [
              'Clients do not need a long policy. They need to know which situations may change the appointment and when the decision will be made.',
              'This reduces uncertainty and makes weather communication feel consistent.',
            ],
            bullets: [
              'Unsafe heat or cold for the dog.',
              'Storms, strong wind, or dangerous ground conditions.',
              'Heavy rain that prevents the session goal.',
              'A clear decision time before the appointment.',
            ],
          },
          {
            heading: 'Offer a few fallback paths',
            paragraphs: [
              'Rescheduling is not the only option. Some sessions can move indoors, change location, shorten the outdoor portion, or become a planning call.',
              'Having options ready helps the trainer protect the day without cancelling more than necessary.',
            ],
          },
          {
            heading: 'Repeat the rule in reminders',
            paragraphs: [
              'The reminder is a good place to restate the weather rule in one short sentence. It prepares the client before the decision is needed.',
              'When the forecast changes, the client already understands the logic behind the next message.',
            ],
          },
        ],
      },
      fr: {
        slug: 'report-meteo-seances-education-canine',
        category: 'Organisation',
        title: 'Comment gerer les reports meteo sans perdre les clients',
        description:
          'Un cadre pratique pour les seances en exterieur lorsque pluie, chaleur, orage ou conditions dangereuses influencent le rendez-vous.',
        excerpt:
          'Les regles meteo sont mieux acceptees lorsqu elles sont visibles avant que la prevision devienne un probleme.',
        tags: ['Meteo', 'Report', 'Organisation'],
        coverImage: {
          src: '/blog/covers/weather-rescheduling.svg',
          alt: 'Checklist de report meteo pour rendez-vous d education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Clarifier les regles de report',
        ctaDescription:
          'MagicHango aide les educateurs a garder regles de reservation, rappels et communication client coherents.',
        ctaLabel: 'Clarifier les reports',
        sections: [
          {
            heading: 'Les decisions meteo ne doivent pas etre improvisees',
            paragraphs: [
              'L education en exterieur depend des vraies conditions. Une petite pluie peut etre acceptable, la chaleur peut etre dangereuse et l orage peut rendre la seance impossible. Si la regle est floue, chaque prevision devient une negociation.',
              'Une politique meteo simple rend la decision plus professionnelle et plus facile a comprendre.',
            ],
          },
          {
            heading: 'Definir ce qui change le plan',
            paragraphs: [
              'Les clients n ont pas besoin d une longue politique. Ils doivent savoir quelles situations peuvent modifier le rendez-vous et quand la decision sera prise.',
              'Cela reduit l incertitude et rend la communication meteo plus coherente.',
            ],
            bullets: [
              'Chaleur ou froid dangereux pour le chien.',
              'Orage, vent fort ou sol dangereux.',
              'Pluie forte qui empeche l objectif de la seance.',
              'Heure claire de decision avant le rendez-vous.',
            ],
          },
          {
            heading: 'Prevoir quelques alternatives',
            paragraphs: [
              'Reporter n est pas la seule option. Certaines seances peuvent passer en interieur, changer de lieu, raccourcir la partie dehors ou devenir un appel de preparation.',
              'Avoir des options pretes aide l educateur a proteger la journee sans annuler plus que necessaire.',
            ],
          },
          {
            heading: 'Repeter la regle dans les rappels',
            paragraphs: [
              'Le rappel est un bon endroit pour rappeler la regle meteo en une phrase courte. Il prepare le client avant que la decision soit necessaire.',
              'Lorsque la prevision change, le client comprend deja la logique du message suivant.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'package-page-explainer',
    publishedAt: '2026-04-25',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'explain-dog-training-packages-booking-page',
        category: 'Booking',
        title: 'How to explain training packages on a booking page',
        description:
          'A practical structure for presenting dog training packages clearly so clients understand the difference between options before they book.',
        excerpt:
          'Packages sell better when clients can compare outcomes, rhythm, and commitment without decoding a wall of text.',
        tags: ['Packages', 'Booking', 'Clarity'],
        coverImage: {
          src: '/blog/covers/package-page.svg',
          alt: 'Three dog training package cards presented on a booking page',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make package choices easier',
        ctaDescription:
          'MagicHango helps trainers present services and booking options in a way clients can actually act on.',
        ctaLabel: 'Clarify service booking',
        sections: [
          {
            heading: 'A package page should reduce comparison work',
            paragraphs: [
              'When clients see several package options, they try to understand what changes: number of sessions, rhythm, support, price, and expected outcome.',
              'If those differences are buried in paragraphs, the client may hesitate or ask for clarification before booking.',
            ],
          },
          {
            heading: 'Compare packages on the same criteria',
            paragraphs: [
              'The easiest package pages use the same structure for each offer. This makes comparison faster and lowers the risk that clients choose the wrong fit.',
              'The goal is not to oversimplify the service, but to make the decision readable.',
            ],
            bullets: [
              'Who the package is for.',
              'What goal or situation it supports.',
              'How many sessions are included.',
              'Recommended rhythm between sessions.',
              'What happens after the package ends.',
            ],
          },
          {
            heading: 'Avoid naming packages only by size',
            paragraphs: [
              'Names like small, medium, and large are easy internally but not always useful for clients. A name connected to the client goal often works better.',
              'For example, a puppy start package, a recall focus package, or a home routine package tells the client why the option exists.',
            ],
          },
          {
            heading: 'Keep a path for unsure clients',
            paragraphs: [
              'Some clients will not know which package fits. Give them a simple fallback: book an assessment, request guidance, or choose a first session before committing.',
              'That keeps uncertainty from blocking the booking entirely.',
            ],
          },
        ],
      },
      fr: {
        slug: 'expliquer-forfaits-page-reservation-education-canine',
        category: 'Reservation',
        title: 'Comment expliquer ses forfaits sur une page de reservation',
        description:
          'Une structure pratique pour presenter clairement les forfaits afin que les clients comprennent les differences avant de reserver.',
        excerpt:
          'Les forfaits se vendent mieux lorsque les clients comparent objectifs, rythme et engagement sans decoder un mur de texte.',
        tags: ['Forfaits', 'Reservation', 'Clarte'],
        coverImage: {
          src: '/blog/covers/package-page.svg',
          alt: 'Trois cartes de forfaits d education canine sur une page de reservation',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les forfaits plus faciles a choisir',
        ctaDescription:
          'MagicHango aide les educateurs a presenter services et options de reservation de maniere vraiment actionnable.',
        ctaLabel: 'Clarifier les services',
        sections: [
          {
            heading: 'Une page forfait doit reduire l effort de comparaison',
            paragraphs: [
              'Lorsque les clients voient plusieurs forfaits, ils cherchent ce qui change : nombre de seances, rythme, accompagnement, prix et resultat attendu.',
              'Si ces differences sont cachees dans de longs paragraphes, le client hesite ou demande une clarification avant de reserver.',
            ],
          },
          {
            heading: 'Comparer les forfaits avec les memes criteres',
            paragraphs: [
              'Les pages les plus simples utilisent la meme structure pour chaque offre. La comparaison devient plus rapide et le risque de mauvais choix diminue.',
              'L objectif n est pas de simplifier a l exces, mais de rendre la decision lisible.',
            ],
            bullets: [
              'A qui s adresse le forfait.',
              'Quel objectif ou quelle situation il accompagne.',
              'Combien de seances sont incluses.',
              'Quel rythme est recommande entre les seances.',
              'Ce qui se passe apres la fin du forfait.',
            ],
          },
          {
            heading: 'Eviter les noms bases seulement sur la taille',
            paragraphs: [
              'Des noms comme petit, moyen et grand sont simples en interne, mais pas toujours utiles pour les clients. Un nom relie a l objectif fonctionne souvent mieux.',
              'Par exemple, forfait demarrage chiot, forfait rappel ou forfait routine a domicile explique pourquoi l option existe.',
            ],
          },
          {
            heading: 'Garder un chemin pour les clients indecis',
            paragraphs: [
              'Certains clients ne sauront pas quel forfait choisir. Donnez-leur une sortie simple : reserver un bilan, demander un conseil ou choisir une premiere seance avant de s engager.',
              'Cela evite que l incertitude bloque completement la reservation.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'school-holiday-planning',
    publishedAt: '2026-05-14',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-trainer-school-holiday-planning',
        category: 'Planning',
        title: 'How dog trainers can prepare their calendar for school holidays',
        description:
          'A practical planning guide for handling shifting family routines, travel constraints, and demand changes during school holidays.',
        excerpt:
          'School holidays change client availability quickly. A little preparation keeps the calendar readable instead of reactive.',
        tags: ['Holidays', 'Planning', 'Availability'],
        coverImage: {
          src: '/blog/covers/school-holidays.svg',
          alt: 'School holiday planning calendar for dog training sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep holiday weeks under control',
        ctaDescription:
          'MagicHango helps trainers adjust availability and booking choices when normal weekly routines change.',
        ctaLabel: 'Plan holiday availability',
        sections: [
          {
            heading: 'Holiday weeks do not behave like normal weeks',
            paragraphs: [
              'During school holidays, clients may be away, children may be home, traffic patterns may change, and some families suddenly have more flexibility than usual. The same availability rules can create a very different week.',
              'Preparing early helps you decide which slots should stay open, which should be protected, and which clients may need a different rhythm.',
            ],
          },
          {
            heading: 'Separate stable clients from flexible clients',
            paragraphs: [
              'Some clients want to keep their usual rhythm during holidays. Others prefer a temporary change because family routines are different. Treating both groups the same can create unnecessary rescheduling.',
              'A simple check-in before the holiday period lets you preserve the reliable appointments and use flexibility where it actually helps.',
            ],
            bullets: [
              'Ask repeat clients whether their usual time still works.',
              'Offer flexible clients a short list of stronger holiday slots.',
              'Protect travel-heavy days from last-minute scattered bookings.',
              'Close weak gaps before they become awkward appointments.',
            ],
          },
          {
            heading: 'Use holidays to clean the route',
            paragraphs: [
              'Holiday periods can be a chance to rebuild the week around better clusters. If several clients are more flexible, guide them toward days and zones that reduce travel.',
              'This keeps the business available without letting the calendar become random.',
            ],
          },
          {
            heading: 'Communicate the temporary rules clearly',
            paragraphs: [
              'Clients usually accept temporary holiday rules when they are visible and simple. Explain whether availability is reduced, expanded, or grouped differently.',
              'The goal is to make the change feel planned, not like the calendar is suddenly harder to access.',
            ],
          },
        ],
      },
      fr: {
        slug: 'planning-vacances-scolaires-educateur-canin',
        category: 'Planning',
        title: 'Comment preparer son planning pendant les vacances scolaires',
        description:
          'Un guide pratique pour gerer les routines familiales qui changent, les contraintes de trajet et les variations de demande pendant les vacances.',
        excerpt:
          'Les vacances scolaires changent vite les disponibilites des clients. Un peu de preparation garde le planning lisible au lieu de le subir.',
        tags: ['Vacances', 'Planning', 'Disponibilites'],
        coverImage: {
          src: '/blog/covers/school-holidays.svg',
          alt: 'Calendrier de vacances scolaires pour seances d education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Garder les semaines de vacances sous controle',
        ctaDescription:
          'MagicHango aide les educateurs a ajuster les disponibilites et les choix de reservation lorsque les routines changent.',
        ctaLabel: 'Planifier les vacances',
        sections: [
          {
            heading: 'Les vacances ne ressemblent pas aux semaines normales',
            paragraphs: [
              'Pendant les vacances scolaires, les clients peuvent etre absents, les enfants peuvent etre a la maison, les trajets changent et certaines familles deviennent soudain plus flexibles. Les memes regles de disponibilite peuvent produire une semaine tres differente.',
              'Preparer la periode en avance aide a decider quels creneaux garder ouverts, lesquels proteger et quels clients peuvent avoir besoin d un rythme different.',
            ],
          },
          {
            heading: 'Distinguer les clients stables des clients flexibles',
            paragraphs: [
              'Certains clients veulent garder leur rythme habituel pendant les vacances. D autres preferent un changement temporaire parce que la routine familiale bouge. Traiter les deux groupes pareil cree souvent des reports inutiles.',
              'Un simple point avant les vacances permet de conserver les rendez-vous fiables et d utiliser la flexibilite la ou elle aide vraiment.',
            ],
            bullets: [
              'Demander aux clients reguliers si leur horaire habituel fonctionne encore.',
              'Proposer aux clients flexibles une courte selection de bons creneaux.',
              'Proteger les jours avec beaucoup de trajet contre les reservations dispersees.',
              'Fermer les trous faibles avant qu ils deviennent des rendez-vous difficiles.',
            ],
          },
          {
            heading: 'Utiliser les vacances pour nettoyer la tournee',
            paragraphs: [
              'Les vacances peuvent etre l occasion de reconstruire la semaine autour de meilleurs regroupements. Si plusieurs clients sont plus flexibles, orientez-les vers les jours et zones qui reduisent les trajets.',
              'L activite reste disponible sans laisser le planning devenir aleatoire.',
            ],
          },
          {
            heading: 'Communiquer clairement les regles temporaires',
            paragraphs: [
              'Les clients acceptent bien les regles temporaires lorsqu elles sont visibles et simples. Expliquez si les disponibilites sont reduites, elargies ou regroupees autrement.',
              'L objectif est que le changement paraisse organise, pas comme un agenda soudainement plus difficile a utiliser.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'maintenance-sessions',
    publishedAt: '2026-04-28',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'dog-training-maintenance-sessions',
        category: 'Client experience',
        title: 'When should you offer maintenance sessions after a training goal is reached?',
        description:
          'A practical way to propose light follow-up sessions that protect progress without making clients feel locked into endless training.',
        excerpt:
          'Maintenance sessions work best when they are framed as support for progress, not as proof that the client is never finished.',
        tags: ['Follow-up', 'Retention', 'Progress'],
        coverImage: {
          src: '/blog/covers/maintenance-sessions.svg',
          alt: 'Circular follow-up flow for dog training maintenance sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep follow-up gentle and organized',
        ctaDescription:
          'MagicHango helps trainers structure follow-up bookings without turning the calendar into manual reminders.',
        ctaLabel: 'Plan follow-up sessions',
        sections: [
          {
            heading: 'Maintenance should feel supportive',
            paragraphs: [
              'After a client reaches an important goal, it can feel awkward to suggest another session. The key is to frame maintenance as a way to protect progress, answer new questions, and adjust before small issues grow.',
              'That tone matters. Clients should not feel that they failed because they still need occasional support.',
            ],
          },
          {
            heading: 'Choose moments where follow-up is useful',
            paragraphs: [
              'Maintenance sessions are most helpful when the dog routine is likely to change or when the client is entering a new stage.',
              'Instead of offering follow-up to everyone in the same way, connect it to a real trigger in the client life.',
            ],
            bullets: [
              'A puppy entering adolescence.',
              'A move, holiday, new baby, or new household routine.',
              'A client preparing for travel or visitors.',
              'A skill that works at home but needs proofing outside.',
            ],
          },
          {
            heading: 'Make the format lighter than the initial plan',
            paragraphs: [
              'A maintenance appointment does not always need the same length or intensity as an early session. It may be a shorter check-in, a targeted walk, or a single adjustment visit.',
              'A lighter format makes the offer easier to accept and keeps the relationship active without pressure.',
            ],
          },
          {
            heading: 'Book the next review before the need becomes urgent',
            paragraphs: [
              'The best follow-up often happens before the client feels stuck again. A suggested review window gives them a simple path back.',
              'This is useful for the trainer too: predictable follow-up is easier to plan than surprise urgent requests.',
            ],
          },
        ],
      },
      fr: {
        slug: 'seances-entretien-education-canine',
        category: 'Experience client',
        title: 'Quand proposer des seances d entretien apres un objectif atteint',
        description:
          'Une methode pratique pour proposer des suivis legers qui protegent les progres sans donner au client l impression d etre enferme dans un accompagnement sans fin.',
        excerpt:
          'Les seances d entretien fonctionnent mieux lorsqu elles soutiennent les progres, pas lorsqu elles donnent l impression que le client n a jamais termine.',
        tags: ['Suivi', 'Fidelisation', 'Progres'],
        coverImage: {
          src: '/blog/covers/maintenance-sessions.svg',
          alt: 'Boucle de suivi pour seances d entretien en education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Garder un suivi doux et organise',
        ctaDescription:
          'MagicHango aide les educateurs a structurer les suivis sans transformer le planning en rappels manuels permanents.',
        ctaLabel: 'Planifier les suivis',
        sections: [
          {
            heading: 'L entretien doit paraitre soutenant',
            paragraphs: [
              'Apres un objectif important, proposer une nouvelle seance peut sembler delicat. L idee est de presenter l entretien comme une maniere de proteger les progres, repondre aux nouvelles questions et ajuster avant que les petits sujets grossissent.',
              'Le ton compte beaucoup. Le client ne doit pas avoir l impression d avoir echoue parce qu il a encore besoin d un soutien ponctuel.',
            ],
          },
          {
            heading: 'Choisir les moments ou le suivi est utile',
            paragraphs: [
              'Les seances d entretien sont les plus utiles lorsque la routine du chien risque de changer ou lorsque le client entre dans une nouvelle etape.',
              'Au lieu de proposer le meme suivi a tout le monde, reliez-le a un vrai declencheur dans la vie du client.',
            ],
            bullets: [
              'Un chiot qui entre dans l adolescence.',
              'Un demenagement, des vacances, un bebe ou une nouvelle routine familiale.',
              'Un client qui prepare un voyage ou la venue d invites.',
              'Un apprentissage acquis a la maison mais a generaliser dehors.',
            ],
          },
          {
            heading: 'Rendre le format plus leger que le plan initial',
            paragraphs: [
              'Une seance d entretien n a pas toujours besoin de la meme duree ou intensite qu une premiere phase. Cela peut etre un point plus court, une promenade ciblee ou une visite d ajustement.',
              'Un format leger rend l offre plus facile a accepter et garde la relation active sans pression.',
            ],
          },
          {
            heading: 'Prevoir la prochaine revue avant l urgence',
            paragraphs: [
              'Le meilleur suivi arrive souvent avant que le client se sente bloque a nouveau. Une fenetre de revue proposee lui donne un chemin simple pour revenir.',
              'C est aussi utile pour l educateur : les suivis previsibles sont plus faciles a organiser que les demandes urgentes surprises.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'first-session-slot-choice',
    publishedAt: '2026-04-27',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'best-first-session-time-slots-dog-training',
        category: 'Booking',
        title: 'Which time slots work best for first dog training sessions?',
        description:
          'A practical guide to choosing first-session slots that leave enough energy, context, and travel margin for a strong client start.',
        excerpt:
          'A first session is not just another appointment. The slot you offer can shape the quality of the whole relationship.',
        tags: ['First session', 'Booking', 'Planning'],
        coverImage: {
          src: '/blog/covers/first-session-slots.svg',
          alt: 'Three recommended first-session time slots for dog training',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Offer better first-session slots',
        ctaDescription:
          'MagicHango helps trainers guide clients toward appointment options that fit the real shape of the day.',
        ctaLabel: 'Improve first bookings',
        sections: [
          {
            heading: 'First sessions need more space',
            paragraphs: [
              'A first appointment carries more uncertainty than a routine follow-up. The dog may need observation, the family may have a long story, and the trainer may need time to understand the home context.',
              'That makes the slot choice important. A fragile gap may be fine for a quick follow-up, but it can make a first session feel rushed.',
            ],
          },
          {
            heading: 'Avoid the most compressed parts of the day',
            paragraphs: [
              'First sessions usually work better when the trainer has enough buffer before and after the visit. This protects arrival time, note-taking, and the mental reset needed before the next appointment.',
              'Offering only the weakest gaps can create a poor first impression even if the trainer is highly skilled.',
            ],
            bullets: [
              'Avoid placing first sessions between two tight travel blocks.',
              'Prefer slots with a clear arrival margin.',
              'Protect enough time afterward for notes and follow-up.',
              'Consider whether household routines make the time calmer or harder.',
            ],
          },
          {
            heading: 'Match the slot to the client context',
            paragraphs: [
              'A puppy consultation may work well at a different time than a reactive-dog session. A family session may need a window where the right people are home and not rushing.',
              'The best slot is not only available. It gives the session the conditions it needs to succeed.',
            ],
          },
          {
            heading: 'Guide clients instead of showing everything',
            paragraphs: [
              'Clients may not know which time is operationally strong. A short list of good first-session options helps them choose without needing to understand the full calendar.',
              'This keeps the first step simple while protecting the trainer ability to deliver a calm, thoughtful appointment.',
            ],
          },
        ],
      },
      fr: {
        slug: 'meilleurs-creneaux-premiere-seance-education-canine',
        category: 'Reservation',
        title: 'Quels creneaux fonctionnent le mieux pour une premiere seance',
        description:
          'Un guide pratique pour choisir des creneaux de premiere seance qui laissent assez d energie, de contexte et de marge de trajet.',
        excerpt:
          'Une premiere seance n est pas un rendez-vous comme les autres. Le creneau propose peut influencer toute la relation client.',
        tags: ['Premiere seance', 'Reservation', 'Planning'],
        coverImage: {
          src: '/blog/covers/first-session-slots.svg',
          alt: 'Trois creneaux recommandes pour une premiere seance canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Proposer de meilleurs creneaux de premiere seance',
        ctaDescription:
          'MagicHango aide les educateurs a guider les clients vers des options qui respectent la vraie forme de la journee.',
        ctaLabel: 'Ameliorer les premieres reservations',
        sections: [
          {
            heading: 'Les premieres seances demandent plus d espace',
            paragraphs: [
              'Un premier rendez-vous contient plus d incertitude qu un suivi habituel. Le chien doit parfois etre observe, la famille a souvent beaucoup de contexte a partager et l educateur doit comprendre l environnement.',
              'Le choix du creneau compte donc beaucoup. Un petit trou peut suffire pour un suivi rapide, mais rendre une premiere seance trop pressee.',
            ],
          },
          {
            heading: 'Eviter les moments les plus compresses',
            paragraphs: [
              'Les premieres seances fonctionnent souvent mieux lorsque l educateur dispose d une marge avant et apres. Cela protege l arrivee, la prise de notes et le temps mental necessaire avant le rendez-vous suivant.',
              'Proposer seulement les trous les moins pratiques peut creer une mauvaise premiere impression, meme avec une excellente qualite de service.',
            ],
            bullets: [
              'Eviter les premieres seances entre deux blocs de trajet serres.',
              'Preferer les creneaux avec une vraie marge d arrivee.',
              'Proteger assez de temps apres pour les notes et le suivi.',
              'Verifier si la routine du foyer rend ce moment plus calme ou plus difficile.',
            ],
          },
          {
            heading: 'Adapter le creneau au contexte client',
            paragraphs: [
              'Une consultation chiot ne demande pas toujours le meme moment qu une seance avec un chien reactif. Une seance familiale peut avoir besoin d une fenetre ou les bonnes personnes sont presentes et disponibles.',
              'Le meilleur creneau n est pas seulement libre. Il donne a la seance les conditions pour bien commencer.',
            ],
          },
          {
            heading: 'Guider les clients au lieu de tout montrer',
            paragraphs: [
              'Les clients ne savent pas toujours quel horaire est solide d un point de vue operationnel. Une courte selection de bons creneaux de premiere seance les aide a choisir sans comprendre tout le planning.',
              'Le premier pas reste simple, tout en protegeant la capacite de l educateur a livrer un rendez-vous calme et attentif.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'urgent-request-qualification',
    publishedAt: '2026-05-13',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'qualify-urgent-dog-training-requests',
        category: 'Operations',
        title: 'How to qualify urgent dog training requests without disrupting the whole week',
        description:
          'A practical triage framework for dog trainers who receive urgent messages and need to decide what deserves a fast slot.',
        excerpt:
          'Not every urgent request needs the same response. A simple triage flow protects the week while helping the cases that truly need priority.',
        tags: ['Urgency', 'Triage', 'Planning'],
        coverImage: {
          src: '/blog/covers/urgent-requests.svg',
          alt: 'Urgent dog training request triage board with priority levels',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Handle urgent requests with more clarity',
        ctaDescription:
          'MagicHango helps trainers keep booking choices connected to real capacity instead of reacting to every message in isolation.',
        ctaLabel: 'Organize urgent bookings',
        sections: [
          {
            heading: 'Urgent does not always mean immediate',
            paragraphs: [
              'Dog trainers often receive messages that sound urgent: biting, barking, pulling, a new puppy, a difficult walk, or a family that feels overwhelmed. The pressure is real, but not every request needs the same calendar response.',
              'A triage habit helps you separate safety concerns, emotional urgency, and normal scheduling pressure. That distinction protects the week while still taking the client seriously.',
            ],
          },
          {
            heading: 'Ask the questions that change priority',
            paragraphs: [
              'The first reply should gather just enough information to decide the next step. Long forms slow the moment down, but vague replies leave you guessing.',
              'A few targeted questions can show whether the case needs a faster slot, a phone screen, a referral, or a standard booking path.',
            ],
            bullets: [
              'Has anyone been bitten or physically at risk?',
              'Is the behavior happening daily, weekly, or only in one context?',
              'Are children, elderly people, or other animals involved?',
              'What changed recently in the dog routine or environment?',
              'Can the client follow short safety instructions before the session?',
            ],
          },
          {
            heading: 'Create priority lanes',
            paragraphs: [
              'A simple priority model prevents every urgent message from becoming a calendar emergency. Safety cases may need a fast call. High-stress but stable cases may need a close appointment. Routine concerns can go through normal availability.',
              'The client experience improves because the response feels structured rather than improvised.',
            ],
          },
          {
            heading: 'Keep one small buffer for real priority work',
            paragraphs: [
              'If every week is fully packed, urgent requests either break the schedule or get ignored. Keeping a small protected window gives you room to help without sacrificing the rest of the week.',
              'That buffer should be used deliberately. When it is gone, the next urgent request needs a clear alternative rather than a squeezed appointment.',
            ],
          },
        ],
      },
      fr: {
        slug: 'qualifier-demandes-urgentes-education-canine',
        category: 'Organisation',
        title: 'Comment qualifier les demandes urgentes sans deranger toute la semaine',
        description:
          'Un cadre de tri pratique pour les educateurs canins qui recoivent des messages urgents et doivent choisir ce qui merite un creneau rapide.',
        excerpt:
          'Toutes les demandes urgentes ne demandent pas la meme reponse. Un tri simple protege la semaine tout en aidant les cas vraiment prioritaires.',
        tags: ['Urgence', 'Tri', 'Planning'],
        coverImage: {
          src: '/blog/covers/urgent-requests.svg',
          alt: 'Tableau de tri des demandes urgentes en education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Gerer les urgences avec plus de clarte',
        ctaDescription:
          'MagicHango aide les educateurs a relier les choix de reservation a la vraie capacite au lieu de reagir a chaque message isolement.',
        ctaLabel: 'Organiser les demandes urgentes',
        sections: [
          {
            heading: 'Urgent ne veut pas toujours dire immediat',
            paragraphs: [
              'Les educateurs canins recoivent souvent des messages qui semblent urgents : morsure, aboiements, traction, nouveau chiot, promenade difficile ou famille depassee. La pression est reelle, mais toutes les demandes ne meritent pas la meme reponse dans l agenda.',
              'Une habitude de tri aide a distinguer le risque de securite, l urgence emotionnelle et la pression normale de planning. Cette distinction protege la semaine tout en prenant le client au serieux.',
            ],
          },
          {
            heading: 'Poser les questions qui changent la priorite',
            paragraphs: [
              'La premiere reponse doit collecter juste assez d informations pour decider la suite. Les longs formulaires ralentissent le moment, mais les reponses vagues vous laissent deviner.',
              'Quelques questions ciblees montrent si le cas demande un creneau plus rapide, un appel de qualification, une orientation ou un parcours de reservation standard.',
            ],
            bullets: [
              'Quelqu un a-t-il ete mordu ou mis physiquement en danger ?',
              'Le comportement arrive-t-il chaque jour, chaque semaine ou dans un seul contexte ?',
              'Des enfants, personnes agees ou autres animaux sont-ils concernes ?',
              'Qu est-ce qui a change recemment dans la routine ou l environnement du chien ?',
              'Le client peut-il appliquer de courtes consignes de securite avant la seance ?',
            ],
          },
          {
            heading: 'Creer des niveaux de priorite',
            paragraphs: [
              'Un modele simple evite que chaque message urgent devienne une urgence de calendrier. Les cas de securite peuvent demander un appel rapide. Les cas tres stressants mais stables peuvent obtenir un rendez-vous proche. Les demandes courantes passent par les disponibilites normales.',
              'L experience client s ameliore parce que la reponse parait structuree plutot qu improvisee.',
            ],
          },
          {
            heading: 'Garder une petite marge pour les vraies priorites',
            paragraphs: [
              'Si chaque semaine est totalement remplie, les demandes urgentes cassent le planning ou restent ignorees. Garder une petite fenetre protegee permet d aider sans sacrifier le reste de la semaine.',
              'Cette marge doit etre utilisee volontairement. Lorsqu elle est prise, la demande urgente suivante a besoin d une alternative claire plutot que d un rendez-vous serre.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'address-change-management',
    publishedAt: '2026-05-01',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'manage-address-changes-dog-training',
        category: 'Booking',
        title: 'How to handle address changes without breaking the route',
        description:
          'A practical approach for dog trainers when clients move a session location, update a meeting point, or add a new home address.',
        excerpt:
          'An address change is not a small detail when travel shapes the day. Treat it like a booking change, not a note.',
        tags: ['Address', 'Travel', 'Booking'],
        coverImage: {
          src: '/blog/covers/address-changes.svg',
          alt: 'Two home addresses connected by a route change arrow',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep locations aligned with the calendar',
        ctaDescription:
          'MagicHango helps trainers keep addresses, travel assumptions, and booking choices connected.',
        ctaLabel: 'Manage booking locations',
        sections: [
          {
            heading: 'An address change changes the appointment',
            paragraphs: [
              'When a client changes the meeting place, the session may still look identical in the calendar. Operationally, it can be a different appointment. Travel time, parking, route order, and arrival reliability can all change.',
              'That is why address changes need a clear process. They should not sit as a casual note that the trainer discovers too late.',
            ],
          },
          {
            heading: 'Confirm the new location before accepting the change',
            paragraphs: [
              'A new address should be checked before the appointment is treated as confirmed. The trainer needs to know whether it still fits the route and whether the meeting instructions are clear.',
              'This protects punctuality and avoids surprising the client later with a rushed correction.',
            ],
            bullets: [
              'Ask for the exact address, not only a neighborhood.',
              'Check travel time against the previous and next sessions.',
              'Confirm parking, entry code, or meeting point details.',
              'Re-send the confirmation with the updated location.',
            ],
          },
          {
            heading: 'Set a deadline for late location changes',
            paragraphs: [
              'Clients often see an address update as harmless because the service is the same. A clear deadline helps them understand that location affects the whole route.',
              'The rule can stay calm: after a certain point, the change may need approval or may require rescheduling.',
            ],
          },
          {
            heading: 'Keep old and new addresses visible',
            paragraphs: [
              'If a client has multiple possible locations, the booking flow should make the selected address obvious. Ambiguity creates avoidable travel mistakes.',
              'A good system makes the active appointment location easy to verify in reminders, confirmations, and the trainer agenda.',
            ],
          },
        ],
      },
      fr: {
        slug: 'gerer-changements-adresse-education-canine',
        category: 'Reservation',
        title: 'Comment gerer les changements d adresse sans casser la tournee',
        description:
          'Une approche pratique lorsqu un client change le lieu de seance, modifie un point de rendez-vous ou ajoute une nouvelle adresse.',
        excerpt:
          'Un changement d adresse n est pas un detail lorsque les trajets structurent la journee. Il faut le traiter comme une modification de reservation.',
        tags: ['Adresse', 'Trajets', 'Reservation'],
        coverImage: {
          src: '/blog/covers/address-changes.svg',
          alt: 'Deux adresses de domicile reliees par une fleche de changement de trajet',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Relier les lieux au planning',
        ctaDescription:
          'MagicHango aide les educateurs a garder adresses, hypotheses de trajet et choix de reservation connectes.',
        ctaLabel: 'Gerer les lieux de rendez-vous',
        sections: [
          {
            heading: 'Un changement d adresse change le rendez-vous',
            paragraphs: [
              'Quand un client modifie le lieu de rendez-vous, la seance peut sembler identique dans l agenda. En pratique, il peut s agir d un rendez-vous different. Temps de trajet, stationnement, ordre de tournee et ponctualite peuvent changer.',
              'C est pourquoi les changements d adresse ont besoin d un processus clair. Ils ne doivent pas rester dans une simple note decouverte trop tard.',
            ],
          },
          {
            heading: 'Confirmer le nouveau lieu avant d accepter',
            paragraphs: [
              'Une nouvelle adresse doit etre verifiee avant de considerer le rendez-vous comme confirme. L educateur doit savoir si elle reste compatible avec la tournee et si les consignes d acces sont claires.',
              'Cela protege la ponctualite et evite de surprendre le client plus tard avec une correction precipitee.',
            ],
            bullets: [
              'Demander l adresse exacte, pas seulement un quartier.',
              'Verifier le trajet avec la seance precedente et la suivante.',
              'Confirmer stationnement, code d entree ou point de rendez-vous.',
              'Renvoyer la confirmation avec le lieu mis a jour.',
            ],
          },
          {
            heading: 'Fixer une limite pour les changements tardifs',
            paragraphs: [
              'Les clients voient souvent une adresse comme un detail parce que le service reste le meme. Une limite claire leur fait comprendre que le lieu influence toute la tournee.',
              'La regle peut rester calme : apres un certain moment, le changement doit etre approuve ou peut demander un report.',
            ],
          },
          {
            heading: 'Rendre visibles l ancienne et la nouvelle adresse',
            paragraphs: [
              'Si un client a plusieurs lieux possibles, le parcours de reservation doit rendre l adresse choisie evidente. L ambiguite cree des erreurs de trajet evitables.',
              'Un bon systeme rend le lieu actif facile a verifier dans les rappels, les confirmations et l agenda de l educateur.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'client-feedback-loop',
    publishedAt: '2026-04-29',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'use-client-feedback-dog-training-business',
        category: 'Client experience',
        title: 'How to turn client feedback into better dog training operations',
        description:
          'A practical way to collect feedback after sessions and use it to improve reminders, booking clarity, follow-up, and service quality.',
        excerpt:
          'Feedback is most useful when it changes small parts of the operating system, not when it sits as a testimonial folder.',
        tags: ['Feedback', 'Quality', 'Operations'],
        coverImage: {
          src: '/blog/covers/client-feedback.svg',
          alt: 'Client feedback cards connected to service improvement stars',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Use feedback to improve the flow',
        ctaDescription:
          'MagicHango helps trainers keep the client journey visible, from booking to follow-up.',
        ctaLabel: 'Improve the client journey',
        sections: [
          {
            heading: 'Collect feedback close to the session',
            paragraphs: [
              'The best feedback often arrives soon after the appointment, while the client still remembers what felt clear, confusing, reassuring, or missing.',
              'A short request works better than a long survey. The goal is to learn what should be repeated and what should be improved before the next client reaches the same step.',
            ],
          },
          {
            heading: 'Ask about the process, not only the result',
            paragraphs: [
              'Dog training outcomes can take time. If you only ask whether the problem is solved, you may miss useful feedback about communication, booking, reminders, preparation, and follow-up.',
              'Operational feedback helps you improve the experience even before long-term behavior change is visible.',
            ],
            bullets: [
              'Was booking easy to understand?',
              'Did the reminder include the right practical details?',
              'Did the client know what to prepare?',
              'Was the follow-up clear after the session?',
              'What would have made the visit easier?',
            ],
          },
          {
            heading: 'Turn patterns into small fixes',
            paragraphs: [
              'One comment may be anecdotal. Three similar comments are a signal. If clients often ask the same question after booking, the page or confirmation email probably needs a small change.',
              'Small fixes compound: clearer reminders, better preparation notes, improved intake questions, or a more explicit cancellation rule.',
            ],
          },
          {
            heading: 'Close the loop with clients',
            paragraphs: [
              'When feedback leads to a change, mention it when appropriate. Clients appreciate knowing their experience was heard, especially when the update helps future sessions feel smoother.',
              'That loop builds trust and makes feedback feel like part of the service, not an afterthought.',
            ],
          },
        ],
      },
      fr: {
        slug: 'utiliser-avis-clients-education-canine',
        category: 'Experience client',
        title: 'Comment transformer les avis clients en meilleure organisation',
        description:
          'Une methode pratique pour collecter les retours apres les seances et ameliorer rappels, reservation, suivi et qualite de service.',
        excerpt:
          'Un avis devient vraiment utile lorsqu il modifie de petites parties du systeme, pas lorsqu il reste dans un dossier de temoignages.',
        tags: ['Avis', 'Qualite', 'Organisation'],
        coverImage: {
          src: '/blog/covers/client-feedback.svg',
          alt: 'Cartes de retours clients reliees a des ameliorations de service',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Utiliser les retours pour ameliorer le parcours',
        ctaDescription:
          'MagicHango aide les educateurs a garder le parcours client visible, de la reservation au suivi.',
        ctaLabel: 'Ameliorer le parcours client',
        sections: [
          {
            heading: 'Collecter le retour juste apres la seance',
            paragraphs: [
              'Les meilleurs retours arrivent souvent peu apres le rendez-vous, lorsque le client se souvient encore de ce qui etait clair, confus, rassurant ou manquant.',
              'Une demande courte fonctionne mieux qu un long questionnaire. L objectif est de savoir ce qu il faut repeter et ce qu il faut ameliorer avant que le prochain client traverse la meme etape.',
            ],
          },
          {
            heading: 'Interroger le parcours, pas seulement le resultat',
            paragraphs: [
              'Les resultats en education canine prennent parfois du temps. Si vous demandez seulement si le probleme est resolu, vous manquez des retours utiles sur la communication, la reservation, les rappels, la preparation et le suivi.',
              'Les retours operationnels ameliorent l experience avant meme que le changement comportemental long terme soit visible.',
            ],
            bullets: [
              'La reservation etait-elle facile a comprendre ?',
              'Le rappel contenait-il les bons details pratiques ?',
              'Le client savait-il quoi preparer ?',
              'Le suivi apres seance etait-il clair ?',
              'Qu est-ce qui aurait rendu la visite plus simple ?',
            ],
          },
          {
            heading: 'Transformer les tendances en petites corrections',
            paragraphs: [
              'Un commentaire peut etre anecdotique. Trois commentaires similaires deviennent un signal. Si les clients posent souvent la meme question apres reservation, la page ou l email de confirmation doit probablement changer un peu.',
              'Les petites corrections s additionnent : rappels plus clairs, meilleures notes de preparation, questions d intake plus utiles ou regle d annulation plus explicite.',
            ],
          },
          {
            heading: 'Boucler la boucle avec les clients',
            paragraphs: [
              'Lorsqu un retour mene a un changement, mentionnez-le lorsque c est pertinent. Les clients apprecient de savoir que leur experience a ete entendue, surtout lorsque la mise a jour rend les prochaines seances plus simples.',
              'Cette boucle construit la confiance et fait du retour client une partie du service, pas une pensee apres coup.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'home-visit-prep',
    publishedAt: '2026-05-13',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'prepare-home-dog-training-visit',
        category: 'Client experience',
        title: 'How to prepare clients for a home dog training visit',
        description:
          'A simple preparation framework that helps clients set up the home, reduce distractions, and make the first minutes of the session easier.',
        excerpt:
          'A home visit goes better when the client knows what to prepare before the trainer arrives.',
        tags: ['Home visit', 'Preparation', 'Client experience'],
        coverImage: {
          src: '/blog/covers/home-visit-prep.svg',
          alt: 'Home visit preparation checklist for a dog training session',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make every visit easier to prepare',
        ctaDescription:
          'MagicHango helps trainers keep session details, addresses, and reminders clear before the appointment.',
        ctaLabel: 'Prepare better sessions',
        sections: [
          {
            heading: 'The first minutes shape the whole visit',
            paragraphs: [
              'A home session often begins before the trainer rings the bell. If the dog is overstimulated, the family is unsure what to do, or the equipment is missing, the first part of the appointment can become scattered.',
              'A short preparation message helps the client create a calmer starting point. It does not need to be strict. It just needs to remove the obvious uncertainty.',
            ],
          },
          {
            heading: 'Tell clients what to have ready',
            paragraphs: [
              'Preparation is easier when the request is concrete. Clients should know what to gather, where the first conversation will happen, and whether the dog should be loose, leashed, or separated when the trainer arrives.',
              'The more practical the message is, the less the client has to guess.',
            ],
            bullets: [
              'A normal leash, treats the dog can eat, and any equipment already used.',
              'A quiet place for the first conversation if possible.',
              'Clear parking or entry instructions for the trainer.',
              'A note about who should be present during the session.',
            ],
          },
          {
            heading: 'Reduce avoidable distractions',
            paragraphs: [
              'Home environments are naturally busy. Other pets, children, visitors, deliveries, and open doors can all change the session quickly.',
              'The goal is not to create a perfect laboratory. It is to help the client control the first few minutes so the trainer can observe and guide instead of immediately putting out fires.',
            ],
          },
          {
            heading: 'Keep the tone reassuring',
            paragraphs: [
              'Some clients feel embarrassed about their home or their dog behavior. Preparation instructions should sound helpful, not judgmental.',
              'A calm reminder that nothing needs to be perfect can make clients more honest, more relaxed, and easier to support during the visit.',
            ],
          },
        ],
      },
      fr: {
        slug: 'preparer-visite-domicile-education-canine',
        category: 'Experience client',
        title: 'Comment preparer les clients avant une seance a domicile',
        description:
          'Un cadre simple pour aider les clients a preparer le domicile, reduire les distractions et rendre les premieres minutes plus faciles.',
        excerpt:
          'Une visite a domicile se passe mieux lorsque le client sait quoi preparer avant l arrivee de l educateur.',
        tags: ['Domicile', 'Preparation', 'Experience client'],
        coverImage: {
          src: '/blog/covers/home-visit-prep.svg',
          alt: 'Checklist de preparation pour une seance canine a domicile',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre chaque visite plus facile a preparer',
        ctaDescription:
          'MagicHango aide les educateurs a garder les details de seance, les adresses et les rappels clairs avant le rendez-vous.',
        ctaLabel: 'Preparer de meilleures seances',
        sections: [
          {
            heading: 'Les premieres minutes influencent toute la visite',
            paragraphs: [
              'Une seance a domicile commence souvent avant que l educateur sonne. Si le chien est deja tres excite, si la famille ne sait pas quoi faire ou si le materiel manque, le debut du rendez-vous peut devenir brouillon.',
              'Un court message de preparation aide le client a creer un depart plus calme. Il n a pas besoin d etre strict. Il doit surtout enlever les incertitudes evidentes.',
            ],
          },
          {
            heading: 'Dire clairement quoi preparer',
            paragraphs: [
              'La preparation devient plus simple lorsque la demande est concrete. Le client doit savoir quoi rassembler, ou aura lieu la premiere discussion et si le chien doit etre libre, attache ou separe lorsque l educateur arrive.',
              'Plus le message est pratique, moins le client doit deviner.',
            ],
            bullets: [
              'Une laisse habituelle, des friandises adaptees et le materiel deja utilise.',
              'Un endroit calme pour la premiere discussion si possible.',
              'Des consignes claires de stationnement ou d entree.',
              'Une note sur les personnes qui doivent etre presentes.',
            ],
          },
          {
            heading: 'Reduire les distractions evitables',
            paragraphs: [
              'Un domicile est naturellement vivant. Autres animaux, enfants, visiteurs, livraisons et portes ouvertes peuvent vite changer la seance.',
              'L objectif n est pas de creer un laboratoire parfait. Il s agit d aider le client a maitriser les premieres minutes pour que l educateur puisse observer et guider au lieu de gerer l urgence.',
            ],
          },
          {
            heading: 'Garder un ton rassurant',
            paragraphs: [
              'Certains clients sont genes par leur logement ou par le comportement de leur chien. Les consignes de preparation doivent paraitre aidantes, pas jugeantes.',
              'Un rappel calme que rien n a besoin d etre parfait peut rendre les clients plus honnetes, plus detendus et plus faciles a accompagner pendant la visite.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'waitlist-management',
    publishedAt: '2026-05-04',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-trainer-waitlist-management',
        category: 'Operations',
        title: 'How to manage a waitlist without losing good clients',
        description:
          'A practical way for busy dog trainers to collect demand, prioritize requests, and turn cancellations into useful booking opportunities.',
        excerpt:
          'A waitlist should not be a black hole. It should help clients understand what happens next and help trainers fill the right openings.',
        tags: ['Waitlist', 'Capacity', 'Booking'],
        coverImage: {
          src: '/blog/covers/waitlist.svg',
          alt: 'Prioritized waitlist cards for dog training requests',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Turn demand into a clearer queue',
        ctaDescription:
          'MagicHango helps trainers keep booking demand and availability close enough to act when a good slot appears.',
        ctaLabel: 'Organize demand',
        sections: [
          {
            heading: 'A waitlist needs a promise',
            paragraphs: [
              'When clients join a waitlist, they want to know whether anything will actually happen. If the process is vague, strong leads may keep searching and book somewhere else.',
              'The promise does not need to guarantee a date. It should explain how requests are reviewed, what information matters, and when the client may hear back.',
            ],
          },
          {
            heading: 'Collect the information that changes priority',
            paragraphs: [
              'A waitlist is useful only if it helps you choose the right client when a slot opens. Collect just enough detail to understand urgency, location, service type, and scheduling flexibility.',
              'This keeps the queue manageable and makes it easier to act quickly after a cancellation.',
            ],
            bullets: [
              'Preferred service or main training goal.',
              'Address or service area.',
              'Days and times that could work.',
              'Urgency and any safety context.',
              'Whether the client can accept a short-notice opening.',
            ],
          },
          {
            heading: 'Prioritize fit, not only arrival order',
            paragraphs: [
              'First come, first served sounds fair, but it is not always operationally smart. A client near an existing route may be the best fit for a cancellation tomorrow, while another request may need a longer first-session slot.',
              'A transparent waitlist can still be fair while considering route, readiness, and the type of opening available.',
            ],
          },
          {
            heading: 'Close the loop after each offer',
            paragraphs: [
              'When a waitlist client receives an offer, give a clear response window. If they decline or do not answer, move on kindly and keep the queue alive.',
              'The goal is to make openings easy to fill without turning every cancellation into a scramble.',
            ],
          },
        ],
      },
      fr: {
        slug: 'gerer-liste-attente-educateur-canin',
        category: 'Organisation',
        title: 'Comment gerer une liste d attente sans perdre de bons clients',
        description:
          'Une methode pratique pour collecter la demande, prioriser les besoins et transformer les annulations en opportunites utiles.',
        excerpt:
          'Une liste d attente ne doit pas etre un trou noir. Elle doit expliquer la suite au client et aider l educateur a remplir les bons creneaux.',
        tags: ['Liste d attente', 'Capacite', 'Reservation'],
        coverImage: {
          src: '/blog/covers/waitlist.svg',
          alt: 'Cartes de liste d attente priorisees pour demandes en education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Transformer la demande en file claire',
        ctaDescription:
          'MagicHango aide les educateurs a garder la demande et les disponibilites assez proches pour agir lorsqu un bon creneau apparait.',
        ctaLabel: 'Organiser la demande',
        sections: [
          {
            heading: 'Une liste d attente a besoin d une promesse',
            paragraphs: [
              'Lorsqu un client rejoint une liste d attente, il veut savoir si quelque chose va vraiment se passer. Si le processus est vague, les bons prospects continuent parfois a chercher ailleurs.',
              'La promesse n a pas besoin de garantir une date. Elle doit expliquer comment les demandes sont relues, quelles informations comptent et quand le client peut avoir un retour.',
            ],
          },
          {
            heading: 'Collecter les informations qui changent la priorite',
            paragraphs: [
              'Une liste d attente est utile seulement si elle aide a choisir le bon client lorsqu un creneau se libere. Collectez juste assez de details pour comprendre l urgence, la localisation, le type de service et la flexibilite horaire.',
              'Cela garde la file gerable et permet d agir plus vite apres une annulation.',
            ],
            bullets: [
              'Service souhaite ou objectif principal.',
              'Adresse ou secteur d intervention.',
              'Jours et horaires possibles.',
              'Urgence et contexte de securite eventuel.',
              'Capacite a accepter un creneau de derniere minute.',
            ],
          },
          {
            heading: 'Prioriser l adequation, pas seulement l ordre d arrivee',
            paragraphs: [
              'Premier arrive, premier servi semble juste, mais ce n est pas toujours le plus intelligent pour l organisation. Un client proche d une tournee existante peut etre le meilleur choix pour une annulation demain, tandis qu une autre demande exige une longue premiere seance.',
              'Une liste transparente peut rester equitable tout en tenant compte de la tournee, de la disponibilite du client et du type de creneau disponible.',
            ],
          },
          {
            heading: 'Boucler chaque proposition',
            paragraphs: [
              'Lorsqu un client en attente recoit une proposition, donnez une fenetre de reponse claire. S il refuse ou ne repond pas, passez au suivant avec bienveillance et gardez la file vivante.',
              'L objectif est de remplir les ouvertures facilement sans transformer chaque annulation en course contre la montre.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'readable-booking-terms',
    publishedAt: '2026-05-02',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'dog-training-booking-terms-that-clients-read',
        category: 'Booking',
        title: 'How to write booking terms clients will actually read',
        description:
          'A practical guide to making cancellation rules, payment expectations, and preparation notes clear without turning the booking page into legal noise.',
        excerpt:
          'Booking terms work better when they are short, visible, and written in the same calm tone as the rest of the client experience.',
        tags: ['Booking', 'Policies', 'Client experience'],
        coverImage: {
          src: '/blog/covers/booking-terms.svg',
          alt: 'Readable booking terms panel with confirmed checklist items',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make booking rules easier to understand',
        ctaDescription:
          'MagicHango helps trainers keep booking rules visible at the moments where clients need them.',
        ctaLabel: 'Clarify booking terms',
        sections: [
          {
            heading: 'Rules are easier to accept when they are easy to read',
            paragraphs: [
              'Clients rarely object to every rule. They object when rules appear late, sound harsh, or feel hidden until there is a problem.',
              'Readable booking terms make expectations clear before the appointment is confirmed. That makes the process feel fairer and reduces awkward conversations later.',
            ],
          },
          {
            heading: 'Put the most important rules near the decision',
            paragraphs: [
              'Long policy pages are easy to ignore. The rules that affect the booking should appear close to the confirmation step, written in short language.',
              'You can still keep detailed terms elsewhere, but the practical version should be visible when the client chooses a time.',
            ],
            bullets: [
              'Cancellation or rescheduling window.',
              'Payment timing and accepted methods.',
              'Travel or location requirements.',
              'What happens if the client is late or absent.',
              'Preparation notes that affect the session.',
            ],
          },
          {
            heading: 'Use a steady tone',
            paragraphs: [
              'A rule can be firm without sounding defensive. Plain language usually works better than legal phrasing for day-to-day booking expectations.',
              'The tone should match the rest of the experience: professional, calm, and clear.',
            ],
          },
          {
            heading: 'Repeat rules at useful moments',
            paragraphs: [
              'The confirmation email and reminder are good places to repeat the most important rule in one sentence. Repetition makes the rule feel stable, not surprising.',
              'When clients see the same expectation before, during, and after booking, the process feels less like a penalty and more like a normal part of working together.',
            ],
          },
        ],
      },
      fr: {
        slug: 'conditions-reservation-education-canine-lisibles',
        category: 'Reservation',
        title: 'Comment ecrire des conditions de reservation vraiment lues',
        description:
          'Un guide pratique pour rendre les regles d annulation, de paiement et de preparation claires sans transformer la page de reservation en bloc juridique.',
        excerpt:
          'Les conditions fonctionnent mieux lorsqu elles sont courtes, visibles et ecrites avec le meme ton calme que le reste du parcours client.',
        tags: ['Reservation', 'Regles', 'Experience client'],
        coverImage: {
          src: '/blog/covers/booking-terms.svg',
          alt: 'Panneau de conditions de reservation lisibles avec checklist',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Rendre les regles plus faciles a comprendre',
        ctaDescription:
          'MagicHango aide les educateurs a garder les regles de reservation visibles aux moments ou les clients en ont besoin.',
        ctaLabel: 'Clarifier les conditions',
        sections: [
          {
            heading: 'Les regles sont mieux acceptees lorsqu elles sont lisibles',
            paragraphs: [
              'Les clients ne refusent pas toutes les regles par principe. Ils reagissent surtout lorsque les regles apparaissent tard, semblent dures ou paraissent cachees jusqu au probleme.',
              'Des conditions lisibles rendent les attentes claires avant la confirmation du rendez-vous. Le parcours parait plus juste et les conversations difficiles diminuent ensuite.',
            ],
          },
          {
            heading: 'Placer les regles importantes pres de la decision',
            paragraphs: [
              'Les longues pages de conditions sont faciles a ignorer. Les regles qui changent la reservation doivent apparaitre pres de l etape de confirmation, avec une formulation courte.',
              'Vous pouvez garder des conditions detaillees ailleurs, mais la version pratique doit etre visible lorsque le client choisit un horaire.',
            ],
            bullets: [
              'Fenetre d annulation ou de report.',
              'Moment du paiement et moyens acceptes.',
              'Exigences de trajet ou de lieu.',
              'Ce qui se passe en cas de retard ou d absence.',
              'Consignes de preparation qui changent la seance.',
            ],
          },
          {
            heading: 'Utiliser un ton stable',
            paragraphs: [
              'Une regle peut etre ferme sans paraitre defensive. Le langage simple fonctionne souvent mieux que le vocabulaire juridique pour les attentes de reservation du quotidien.',
              'Le ton doit rester coherent avec le reste de l experience : professionnel, calme et clair.',
            ],
          },
          {
            heading: 'Repeter les regles aux bons moments',
            paragraphs: [
              'L email de confirmation et le rappel sont de bons endroits pour repeter la regle principale en une phrase. La repetition rend la regle stable, pas surprenante.',
              'Lorsque les clients voient la meme attente avant, pendant et apres la reservation, le processus ressemble moins a une sanction et davantage a une base normale de collaboration.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'client-reactivation',
    publishedAt: '2026-05-07',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'reactivate-past-dog-training-clients',
        category: 'Client experience',
        title: 'How to recontact past clients without sounding pushy',
        description:
          'A calm framework for dog trainers who want to bring previous clients back for follow-up sessions, seasonal refreshers, or new goals.',
        excerpt:
          'Past clients already trust you. The right follow-up message should feel useful, timely, and respectful rather than salesy.',
        tags: ['Retention', 'Follow-up', 'Client experience'],
        coverImage: {
          src: '/blog/covers/client-reactivation.svg',
          alt: 'Follow-up timeline for recontacting past dog training clients',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep client follow-up organized',
        ctaDescription:
          'MagicHango helps trainers keep client history and booking flow close enough to make follow-up easier.',
        ctaLabel: 'Organize follow-ups',
        sections: [
          {
            heading: 'Start from a useful reason',
            paragraphs: [
              'The best reactivation messages do not begin with a discount. They begin with a reason that makes sense for the client: a new season, a known behavior goal, a puppy growing into adolescence, or a follow-up after previous progress.',
              'When the message is grounded in the client journey, it feels like care instead of pressure.',
            ],
          },
          {
            heading: 'Segment past clients simply',
            paragraphs: [
              'You do not need a complex CRM to begin. A few simple groups are enough to make your message more relevant and easier to write.',
              'The goal is to avoid sending the same generic reminder to everyone. A small amount of context makes a follow-up feel personal without taking the whole afternoon.',
            ],
            bullets: [
              'Recent clients who may need a progress check.',
              'Puppy clients entering a new development phase.',
              'Clients with seasonal needs such as travel, guests, or routine changes.',
              'Clients who asked for future help but never booked the next session.',
            ],
          },
          {
            heading: 'Make the next step easy',
            paragraphs: [
              'A follow-up message should not ask the client to solve the scheduling problem from scratch. Offer a clear next step: reply with a question, choose from a few slots, or book a short check-in.',
              'The easier the next step feels, the more likely the client is to act while the topic is fresh.',
            ],
          },
          {
            heading: 'Respect silence',
            paragraphs: [
              'Reactivation works best when it is gentle. One useful message and a later reminder can be enough. If the client does not respond, leave the relationship warm.',
              'A respectful follow-up may not create a booking today, but it often keeps you in mind when the need returns.',
            ],
          },
        ],
      },
      fr: {
        slug: 'relancer-anciens-clients-education-canine',
        category: 'Experience client',
        title: 'Comment relancer d anciens clients sans paraitre insistant',
        description:
          'Un cadre simple pour proposer des suivis, des remises a niveau saisonnier ou de nouveaux objectifs aux clients deja accompagnes.',
        excerpt:
          'Les anciens clients vous font deja confiance. Le bon message de suivi doit paraitre utile, opportun et respectueux, pas commercial.',
        tags: ['Fidelisation', 'Suivi', 'Experience client'],
        coverImage: {
          src: '/blog/covers/client-reactivation.svg',
          alt: 'Timeline de suivi pour relancer d anciens clients en education canine',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Organiser les suivis clients',
        ctaDescription:
          'MagicHango aide les educateurs a garder l historique client et la reservation assez proches pour faciliter les relances utiles.',
        ctaLabel: 'Organiser les suivis',
        sections: [
          {
            heading: 'Partir d une raison utile',
            paragraphs: [
              'Les meilleurs messages de relance ne commencent pas par une promotion. Ils commencent par une raison qui a du sens pour le client : une nouvelle saison, un objectif connu, un chiot qui entre dans l adolescence ou un suivi apres des progres.',
              'Quand le message s appuie sur le parcours du client, il ressemble davantage a de l attention qu a de la pression.',
            ],
          },
          {
            heading: 'Segmenter simplement les anciens clients',
            paragraphs: [
              'Il n est pas necessaire d avoir un CRM complexe pour commencer. Quelques groupes simples suffisent pour rendre le message plus pertinent et plus facile a ecrire.',
              'L objectif est d eviter la meme relance generique pour tout le monde. Un peu de contexte rend le suivi plus personnel sans prendre tout l apres-midi.',
            ],
            bullets: [
              'Clients recents qui peuvent avoir besoin d un point de progression.',
              'Clients chiots qui entrent dans une nouvelle phase de developpement.',
              'Clients avec des besoins saisonniers : voyages, invites, changement de routine.',
              'Clients qui avaient evoque un futur besoin sans reserver la suite.',
            ],
          },
          {
            heading: 'Rendre la prochaine etape facile',
            paragraphs: [
              'Un message de suivi ne doit pas demander au client de resoudre seul le probleme du planning. Proposez une etape claire : repondre a une question, choisir parmi quelques creneaux ou reserver un court point.',
              'Plus la prochaine etape semble simple, plus le client a de chances d agir pendant que le sujet est encore present.',
            ],
          },
          {
            heading: 'Respecter le silence',
            paragraphs: [
              'Une relance fonctionne mieux lorsqu elle reste douce. Un message utile et un rappel plus tard peuvent suffire. Si le client ne repond pas, gardez la relation chaleureuse.',
              'Une relance respectueuse ne cree pas toujours une reservation aujourd hui, mais elle vous garde souvent en tete quand le besoin revient.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'group-session-scheduling',
    publishedAt: '2026-05-06',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'schedule-group-dog-training-sessions',
        category: 'Planning',
        title: 'How to schedule small group sessions without creating calendar chaos',
        description:
          'A practical method for planning group dog training sessions while protecting capacity, location constraints, and client clarity.',
        excerpt:
          'Group sessions can be efficient, but only when the booking rules are clear enough for clients and realistic enough for the trainer.',
        tags: ['Groups', 'Planning', 'Capacity'],
        coverImage: {
          src: '/blog/covers/group-sessions.svg',
          alt: 'Three small group training session cards with grouped participants',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Plan group sessions with clearer rules',
        ctaDescription:
          'MagicHango helps trainers keep capacity, timing, and booking choices aligned across different service formats.',
        ctaLabel: 'Structure group bookings',
        sections: [
          {
            heading: 'Group sessions need stronger rules than private sessions',
            paragraphs: [
              'A private session can often adapt around one client. A group session has more dependencies: location, participant level, dog profiles, arrival time, and the minimum number of bookings needed to make it worthwhile.',
              'That means the booking flow should be more structured from the start. The client should understand what they are joining before they reserve.',
            ],
          },
          {
            heading: 'Define capacity before opening bookings',
            paragraphs: [
              'Capacity is not only about how many people fit in a space. It is also about how many dogs can learn safely, how much individual attention is needed, and how predictable the environment is.',
              'Once capacity is clear, the booking page can show limits confidently instead of treating the group like an unlimited event.',
            ],
            bullets: [
              'Set a minimum number of participants for the session to run.',
              'Set a maximum based on attention and safety, not only space.',
              'Clarify whether dogs need previous evaluation before joining.',
              'Decide how late someone can book or cancel.',
            ],
          },
          {
            heading: 'Keep the client path specific',
            paragraphs: [
              'A group session should not feel like a generic appointment. Clients need the theme, level, location, duration, and preparation instructions in one clear path.',
              'Specificity reduces unsuitable bookings and makes the session easier to run when everyone arrives.',
            ],
          },
          {
            heading: 'Protect the calendar around the group',
            paragraphs: [
              'Group sessions often require setup, travel, and recovery time. If the surrounding calendar is too tight, the efficiency gain disappears quickly.',
              'Treat the group as a block, not just a single appointment. That makes it easier to keep the rest of the day realistic.',
            ],
          },
        ],
      },
      fr: {
        slug: 'planifier-seances-groupe-education-canine',
        category: 'Planning',
        title: 'Comment planifier des seances de groupe sans creer le chaos',
        description:
          'Une methode pratique pour organiser des seances collectives en protegeant la capacite, les contraintes de lieu et la clarte client.',
        excerpt:
          'Les seances de groupe peuvent etre efficaces, mais seulement si les regles de reservation sont claires pour les clients et realistes pour l educateur.',
        tags: ['Groupes', 'Planning', 'Capacite'],
        coverImage: {
          src: '/blog/covers/group-sessions.svg',
          alt: 'Trois cartes de seances de groupe avec participants regroupes',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Planifier les groupes avec des regles claires',
        ctaDescription:
          'MagicHango aide les educateurs a garder capacite, horaires et choix de reservation coherents entre les differents formats de service.',
        ctaLabel: 'Structurer les reservations de groupe',
        sections: [
          {
            heading: 'Les groupes demandent des regles plus fortes',
            paragraphs: [
              'Une seance individuelle peut souvent s adapter autour d un seul client. Une seance de groupe depend de plus d elements : lieu, niveau des participants, profils des chiens, heure d arrivee et nombre minimum de reservations pour que la seance ait du sens.',
              'Le parcours de reservation doit donc etre plus structure des le depart. Le client doit comprendre ce qu il rejoint avant de reserver.',
            ],
          },
          {
            heading: 'Definir la capacite avant d ouvrir les reservations',
            paragraphs: [
              'La capacite ne correspond pas seulement au nombre de personnes qui tiennent dans un lieu. Elle depend aussi du nombre de chiens pouvant apprendre en securite, de l attention individuelle necessaire et de la previsibilite de l environnement.',
              'Une fois cette capacite claire, la page de reservation peut afficher les limites avec assurance au lieu de traiter le groupe comme un evenement illimite.',
            ],
            bullets: [
              'Fixer un minimum de participants pour maintenir la seance.',
              'Fixer un maximum selon l attention et la securite, pas seulement l espace.',
              'Preciser si les chiens doivent etre evalues avant de rejoindre le groupe.',
              'Decider jusqu a quand une personne peut reserver ou annuler.',
            ],
          },
          {
            heading: 'Rendre le parcours client specifique',
            paragraphs: [
              'Une seance de groupe ne doit pas ressembler a un rendez-vous generique. Le client a besoin du theme, du niveau, du lieu, de la duree et des consignes de preparation dans un chemin clair.',
              'Cette precision reduit les mauvaises reservations et rend la seance plus simple a mener lorsque tout le monde arrive.',
            ],
          },
          {
            heading: 'Proteger le planning autour du groupe',
            paragraphs: [
              'Les seances de groupe demandent souvent de l installation, du trajet et un temps de recuperation. Si le reste de l agenda est trop serre, le gain d efficacite disparait vite.',
              'Traitez le groupe comme un bloc, pas seulement comme un rendez-vous. Le reste de la journee devient alors plus realiste.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'reminder-quality',
    publishedAt: '2026-05-05',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'dog-training-appointment-reminder-quality',
        category: 'Booking',
        title: 'What makes an appointment reminder actually useful?',
        description:
          'A practical checklist for reminders that reduce uncertainty, prevent avoidable no-shows, and make dog training sessions easier to attend.',
        excerpt:
          'A reminder should do more than repeat the date. It should remove the small doubts that make clients hesitate or forget.',
        tags: ['Reminders', 'Booking', 'Client experience'],
        coverImage: {
          src: '/blog/covers/reminder-quality.svg',
          alt: 'Appointment reminder checklist with three confirmed message cards',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Send reminders that help',
        ctaDescription:
          'MagicHango keeps booking details ready for reminders so clients receive the information they need before the session.',
        ctaLabel: 'Improve reminders',
        sections: [
          {
            heading: 'A reminder should reduce uncertainty',
            paragraphs: [
              'A weak reminder says the session is tomorrow. A useful reminder helps the client know exactly where to be, when to be there, what to prepare, and what to do if something changes.',
              'That extra clarity can prevent no-shows, late arrivals, and last-minute messages that interrupt the rest of the day.',
            ],
          },
          {
            heading: 'Include the details people search for at the last minute',
            paragraphs: [
              'Most clients do not forget because they do not care. They forget because the appointment competes with everything else in the week. The reminder should bring the important details back to the surface.',
              'Keep the message short, but make it complete enough that the client does not need to dig through old emails.',
            ],
            bullets: [
              'Date, local time, and expected duration.',
              'Exact address or meeting point.',
              'Trainer name and contact path.',
              'What to prepare before the session.',
              'Cancellation or rescheduling rule in one calm sentence.',
            ],
          },
          {
            heading: 'Match timing to the service',
            paragraphs: [
              'A first visit may need a reminder earlier than a routine follow-up, because the client may need to prepare family members, equipment, or context notes.',
              'For simple follow-ups, a shorter reminder window can be enough. The timing should match the amount of preparation required.',
            ],
          },
          {
            heading: 'Keep the tone practical and human',
            paragraphs: [
              'The reminder should not sound like a warning. It should sound like a helpful nudge from a professional who wants the session to go smoothly.',
              'When the tone stays steady, clients are more likely to read the message and less likely to feel managed by a rigid system.',
            ],
          },
        ],
      },
      fr: {
        slug: 'ameliorer-rappels-rendez-vous-education-canine',
        category: 'Reservation',
        title: 'Qu est-ce qui rend un rappel de rendez-vous vraiment utile',
        description:
          'Une checklist pratique pour des rappels qui reduisent l incertitude, evitent des absences et rendent les seances plus faciles a honorer.',
        excerpt:
          'Un rappel ne doit pas seulement repeter la date. Il doit retirer les petits doutes qui font hesiter ou oublier les clients.',
        tags: ['Rappels', 'Reservation', 'Experience client'],
        coverImage: {
          src: '/blog/covers/reminder-quality.svg',
          alt: 'Checklist de rappel de rendez-vous avec trois cartes confirmees',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Envoyer des rappels vraiment utiles',
        ctaDescription:
          'MagicHango garde les details de reservation disponibles pour que les clients recoivent les bonnes informations avant la seance.',
        ctaLabel: 'Ameliorer les rappels',
        sections: [
          {
            heading: 'Un rappel doit reduire l incertitude',
            paragraphs: [
              'Un rappel faible dit que la seance est demain. Un rappel utile aide le client a savoir exactement ou aller, a quelle heure, quoi preparer et quoi faire si quelque chose change.',
              'Cette clarte evite des absences, des retards et des messages de derniere minute qui perturbent le reste de la journee.',
            ],
          },
          {
            heading: 'Inclure les details cherches a la derniere minute',
            paragraphs: [
              'La plupart des clients n oublient pas parce qu ils s en moquent. Ils oublient parce que le rendez-vous est en concurrence avec le reste de la semaine. Le rappel doit remettre les informations importantes au premier plan.',
              'Le message doit rester court, mais assez complet pour que le client n ait pas besoin de fouiller dans d anciens emails.',
            ],
            bullets: [
              'Date, heure locale et duree prevue.',
              'Adresse exacte ou point de rendez-vous.',
              'Nom de l educateur et moyen de contact.',
              'Ce qu il faut preparer avant la seance.',
              'Regle d annulation ou de report en une phrase calme.',
            ],
          },
          {
            heading: 'Adapter le moment au service',
            paragraphs: [
              'Une premiere visite peut demander un rappel plus tot qu un simple suivi, car le client doit parfois preparer des membres de la famille, du materiel ou des notes de contexte.',
              'Pour les suivis simples, une fenetre plus courte suffit souvent. Le timing doit correspondre au niveau de preparation necessaire.',
            ],
          },
          {
            heading: 'Garder un ton pratique et humain',
            paragraphs: [
              'Le rappel ne doit pas sonner comme un avertissement. Il doit ressembler a un coup de pouce utile de la part d un professionnel qui veut que la seance se passe bien.',
              'Quand le ton reste stable, les clients lisent plus facilement le message et se sentent moins enfermes dans un systeme rigide.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'intake-form-first-session',
    publishedAt: '2026-05-11',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-trainer-intake-form-before-first-session',
        category: 'Client experience',
        title: 'What to ask before the first dog training session',
        description:
          'A practical intake form framework for dog trainers who want useful context without overwhelming new clients before the first visit.',
        excerpt:
          'The best intake form is not the longest one. It is the one that gives enough context to prepare the session and reassure the client.',
        tags: ['Intake', 'First session', 'Client experience'],
        coverImage: {
          src: '/blog/covers/intake-form.svg',
          alt: 'Client intake form beside a first-session preparation panel',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Prepare sessions with better context',
        ctaDescription:
          'MagicHango helps trainers keep booking details, addresses, reminders, and client context connected.',
        ctaLabel: 'Create a calmer intake flow',
        sections: [
          {
            heading: 'Ask for context, not a full diagnosis',
            paragraphs: [
              'Before a first session, it is tempting to ask every possible question. The intention is good, but a long form can make the client feel tested before the relationship has even started.',
              'A better intake form gives the trainer enough context to prepare safely and keeps the client moving toward the appointment with confidence.',
            ],
          },
          {
            heading: 'Keep the first form focused',
            paragraphs: [
              'The first intake should answer the practical questions that influence the visit: who will be there, where the session takes place, what the main concern is, and whether there are safety details to know.',
              'More detailed behavioral history can come during the session. The form should make the first conversation better, not replace it.',
            ],
            bullets: [
              'Contact details and exact visit address.',
              'Main goal for the session in the client own words.',
              'Dog age, breed or type, and relevant health notes.',
              'Safety context: reactivity, bite history, escape risk, or household constraints.',
            ],
          },
          {
            heading: 'Use wording that lowers pressure',
            paragraphs: [
              'Clients often worry that they are answering badly. Simple wording helps: ask what they notice, what they hope to improve, and what situations are difficult right now.',
              'This tone gives you usable information while reminding the client that they do not need to arrive with perfect answers.',
            ],
          },
          {
            heading: 'Turn answers into preparation',
            paragraphs: [
              'An intake form is useful only if it changes what happens next. It can help you choose the right duration, prepare safety instructions, confirm the meeting place, or send a more relevant reminder.',
              'When the form feeds the booking flow, the first session feels less improvised and more reassuring for everyone involved.',
            ],
          },
        ],
      },
      fr: {
        slug: 'formulaire-client-avant-premiere-seance-education-canine',
        category: 'Experience client',
        title: 'Que demander avant une premiere seance d education canine',
        description:
          'Un cadre pratique de formulaire client pour obtenir le bon contexte sans surcharger les nouveaux clients avant la premiere visite.',
        excerpt:
          'Le meilleur formulaire n est pas le plus long. C est celui qui donne assez de contexte pour preparer la seance et rassurer le client.',
        tags: ['Formulaire', 'Premiere seance', 'Experience client'],
        coverImage: {
          src: '/blog/covers/intake-form.svg',
          alt: 'Formulaire client a cote d un panneau de preparation de premiere seance',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Preparer les seances avec plus de contexte',
        ctaDescription:
          'MagicHango aide les educateurs a garder reservations, adresses, rappels et contexte client au meme endroit.',
        ctaLabel: 'Creer un parcours plus calme',
        sections: [
          {
            heading: 'Demander du contexte, pas un diagnostic complet',
            paragraphs: [
              'Avant une premiere seance, il est tentant de poser toutes les questions possibles. L intention est bonne, mais un formulaire trop long peut donner au client l impression d etre evalue avant meme le debut de la relation.',
              'Un meilleur formulaire donne a l educateur assez de contexte pour preparer la visite en securite, tout en laissant le client avancer vers le rendez-vous avec confiance.',
            ],
          },
          {
            heading: 'Garder le premier formulaire concentre',
            paragraphs: [
              'Le premier formulaire doit repondre aux questions pratiques qui changent la visite : qui sera present, ou aura lieu la seance, quel est le sujet principal et s il existe des elements de securite a connaitre.',
              'L historique comportemental plus detaille peut venir pendant la seance. Le formulaire doit ameliorer la premiere conversation, pas la remplacer.',
            ],
            bullets: [
              'Coordonnees et adresse exacte de la visite.',
              'Objectif principal de la seance avec les mots du client.',
              'Age du chien, race ou type, et notes de sante utiles.',
              'Contexte de securite : reactivite, morsure, risque de fuite ou contraintes du foyer.',
            ],
          },
          {
            heading: 'Utiliser un ton qui baisse la pression',
            paragraphs: [
              'Les clients craignent souvent de mal repondre. Une formulation simple aide : demandez ce qu ils observent, ce qu ils veulent ameliorer et quelles situations sont difficiles aujourd hui.',
              'Ce ton donne des informations utiles tout en rappelant au client qu il n a pas besoin d arriver avec des reponses parfaites.',
            ],
          },
          {
            heading: 'Transformer les reponses en preparation',
            paragraphs: [
              'Un formulaire est utile seulement s il change ce qui se passe ensuite. Il peut aider a choisir la bonne duree, preparer des consignes de securite, confirmer le lieu ou envoyer un rappel plus pertinent.',
              'Lorsque le formulaire nourrit le parcours de reservation, la premiere seance semble moins improvisee et plus rassurante pour tout le monde.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'package-scheduling',
    publishedAt: '2026-05-10',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-training-package-scheduling',
        category: 'Planning',
        title: 'How to schedule training packages without losing weekly flexibility',
        description:
          'A simple planning method for recurring dog training packages, follow-up sessions, and client progress without locking the calendar too early.',
        excerpt:
          'Packages help clients commit, but they can also freeze the calendar. A lighter scheduling rhythm keeps progress steady and routes flexible.',
        tags: ['Packages', 'Planning', 'Follow-up'],
        coverImage: {
          src: '/blog/covers/package-scheduling.svg',
          alt: 'Training package schedule split into several follow-up sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep packages organized',
        ctaDescription:
          'MagicHango helps trainers balance repeat sessions, new bookings, and route pressure in one weekly view.',
        ctaLabel: 'Plan follow-up sessions',
        sections: [
          {
            heading: 'Packages need rhythm more than rigidity',
            paragraphs: [
              'A package gives the client structure, but it does not mean every session needs to be locked immediately. When all future dates are fixed too early, one change can disturb several weeks of planning.',
              'A better approach is to define a rhythm: weekly, every two weeks, or after a specific practice period. Then schedule the next one or two sessions with enough visibility to keep momentum.',
            ],
          },
          {
            heading: 'Separate commitment from exact dates',
            paragraphs: [
              'The client can commit to a package while the trainer keeps some calendar flexibility. This is especially useful when travel zones, school holidays, weather, or client progress can influence the next best appointment.',
              'The key is to communicate the scheduling rhythm clearly so the package feels structured rather than vague.',
            ],
            bullets: [
              'Confirm the package goal and expected rhythm.',
              'Book the first sessions immediately.',
              'Review the next dates after each visit or every two visits.',
              'Keep a small amount of capacity for follow-up clients each week.',
            ],
          },
          {
            heading: 'Use follow-up windows',
            paragraphs: [
              'Instead of promising a precise day too early, define a follow-up window. For example, the next session should happen between seven and ten days after the first visit, or during the next calm route in the client area.',
              'This keeps the training plan serious while preserving the ability to build a sensible route.',
            ],
          },
          {
            heading: 'Make progress visible',
            paragraphs: [
              'Packages work best when clients understand where they are in the plan. A simple reminder of session count, next objective, and preparation notes can make the process feel more professional.',
              'The calendar then becomes more than a list of appointments. It becomes the visible structure of the client journey.',
            ],
          },
        ],
      },
      fr: {
        slug: 'planifier-forfaits-seances-education-canine',
        category: 'Planning',
        title: 'Comment planifier des forfaits sans perdre la souplesse de la semaine',
        description:
          'Une methode simple pour organiser les forfaits, les suivis et la progression client sans bloquer l agenda trop tot.',
        excerpt:
          'Les forfaits aident les clients a s engager, mais ils peuvent aussi figer l agenda. Un rythme plus leger garde le suivi clair et les tournees souples.',
        tags: ['Forfaits', 'Planning', 'Suivi'],
        coverImage: {
          src: '/blog/covers/package-scheduling.svg',
          alt: 'Planning de forfait d education canine divise en plusieurs seances',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Garder les forfaits organises',
        ctaDescription:
          'MagicHango aide les educateurs a equilibrer seances recurrentes, nouvelles reservations et pression des trajets dans une vue hebdomadaire.',
        ctaLabel: 'Planifier les suivis',
        sections: [
          {
            heading: 'Un forfait a besoin de rythme plus que de rigidite',
            paragraphs: [
              'Un forfait donne une structure au client, mais cela ne veut pas dire que chaque seance doit etre bloquee immediatement. Lorsque toutes les dates futures sont fixees trop tot, un seul changement peut perturber plusieurs semaines.',
              'Une meilleure approche consiste a definir un rythme : chaque semaine, toutes les deux semaines ou apres une periode de pratique precise. Ensuite, on planifie une ou deux prochaines seances avec assez de visibilite pour garder l elan.',
            ],
          },
          {
            heading: 'Separer l engagement des dates exactes',
            paragraphs: [
              'Le client peut s engager sur un forfait pendant que l educateur garde une part de souplesse. C est utile lorsque les zones de trajet, les vacances, la meteo ou la progression du chien peuvent influencer le meilleur prochain rendez-vous.',
              'Le point important est de communiquer clairement le rythme afin que le forfait reste structure et ne paraisse pas vague.',
            ],
            bullets: [
              'Confirmer l objectif du forfait et le rythme attendu.',
              'Reserver les premieres seances tout de suite.',
              'Revoir les prochaines dates apres chaque visite ou toutes les deux visites.',
              'Garder chaque semaine un peu de capacite pour les clients en suivi.',
            ],
          },
          {
            heading: 'Utiliser des fenetres de suivi',
            paragraphs: [
              'Au lieu de promettre une date trop longtemps a l avance, definissez une fenetre de suivi. Par exemple, la prochaine seance doit avoir lieu entre sept et dix jours apres la premiere visite, ou pendant la prochaine tournee calme dans le secteur du client.',
              'Cela garde le plan d education serieux tout en preservant la capacite de construire une tournee logique.',
            ],
          },
          {
            heading: 'Rendre la progression visible',
            paragraphs: [
              'Les forfaits fonctionnent mieux lorsque les clients comprennent ou ils en sont. Un simple rappel du nombre de seances, du prochain objectif et des notes de preparation rend le parcours plus professionnel.',
              'Le calendrier devient alors plus qu une liste de rendez-vous. Il devient la structure visible du parcours client.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'travel-buffers',
    publishedAt: '2026-05-09',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'travel-buffers-between-dog-training-sessions',
        category: 'Operations',
        title: 'How much buffer should you keep between dog training sessions?',
        description:
          'A practical guide to choosing travel and recovery buffers that make the calendar reliable without wasting too much useful time.',
        excerpt:
          'Buffers are not empty time. They are the part of the schedule that keeps visits punctual, calm, and realistic.',
        tags: ['Buffers', 'Travel', 'Reliability'],
        coverImage: {
          src: '/blog/covers/travel-buffers.svg',
          alt: 'Route view with travel buffers between training sessions',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make buffers part of the plan',
        ctaDescription:
          'MagicHango helps trainers think about travel time and booking quality before a slot appears to the client.',
        ctaLabel: 'Build more reliable days',
        sections: [
          {
            heading: 'A buffer is not wasted time',
            paragraphs: [
              'When the calendar is tight, buffer time can look like lost revenue. In practice, it often protects revenue by keeping the day punctual and reducing the chance that one delay damages every following visit.',
              'A good buffer absorbs real life: parking, a longer client question, a difficult dog handoff, traffic, or simply the need to arrive mentally ready for the next session.',
            ],
          },
          {
            heading: 'Use different buffers for different session types',
            paragraphs: [
              'Not every appointment needs the same margin. A first visit may need more space than a routine follow-up. A dense city route may need different assumptions from a rural day.',
              'The goal is to define a few practical rules, then adjust when the route or client context requires it.',
            ],
            bullets: [
              'Short local follow-up: smaller travel buffer if parking is predictable.',
              'First session: extra margin before and after the visit.',
              'New area: protect more time until the route is familiar.',
              'End of day: keep enough margin to avoid carrying delays home.',
            ],
          },
          {
            heading: 'Let buffers guide what clients see',
            paragraphs: [
              'If buffer time only exists in your head, the booking page may still offer risky slots. The best system keeps those margins inside the availability logic.',
              'That way clients see options that already respect the operational reality of the day. The calendar feels more reliable because it was built with the hidden work included.',
            ],
          },
          {
            heading: 'Review buffers when the week feels heavy',
            paragraphs: [
              'If you often arrive late, skip breaks, or feel rushed after certain services, the buffer rules are probably too optimistic. If large gaps appear every week, they may be too cautious.',
              'The right buffer is not a universal number. It is the smallest margin that makes the day consistently workable.',
            ],
          },
        ],
      },
      fr: {
        slug: 'marges-trajet-entre-seances-education-canine',
        category: 'Organisation',
        title: 'Quelle marge garder entre deux seances d education canine',
        description:
          'Un guide pratique pour choisir des marges de trajet et de respiration qui rendent le planning fiable sans perdre trop de temps utile.',
        excerpt:
          'Les marges ne sont pas du temps vide. Elles sont la partie du planning qui garde les visites ponctuelles, calmes et realistes.',
        tags: ['Marges', 'Trajets', 'Fiabilite'],
        coverImage: {
          src: '/blog/covers/travel-buffers.svg',
          alt: 'Vue de tournee avec marges de trajet entre les seances',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Integrer les marges dans le plan',
        ctaDescription:
          'MagicHango aide les educateurs a tenir compte des trajets et de la qualite des reservations avant qu un creneau apparaisse au client.',
        ctaLabel: 'Construire des journees plus fiables',
        sections: [
          {
            heading: 'Une marge n est pas du temps perdu',
            paragraphs: [
              'Quand l agenda est serre, une marge peut ressembler a du chiffre d affaires perdu. En pratique, elle protege souvent le chiffre d affaires en gardant la journee ponctuelle et en evitant qu un retard abime toutes les visites suivantes.',
              'Une bonne marge absorbe la vraie vie : stationnement, question client plus longue, sortie difficile du chien, circulation ou simple besoin d arriver disponible mentalement a la prochaine seance.',
            ],
          },
          {
            heading: 'Adapter les marges au type de seance',
            paragraphs: [
              'Tous les rendez-vous n ont pas besoin de la meme marge. Une premiere visite demande souvent plus d espace qu un suivi simple. Une tournee dense en ville ne se gere pas comme une journee rurale.',
              'L objectif est de definir quelques regles pratiques, puis d ajuster lorsque la tournee ou le contexte client l exige.',
            ],
            bullets: [
              'Suivi local court : marge plus faible si le stationnement est previsible.',
              'Premiere seance : marge supplementaire avant et apres la visite.',
              'Nouveau secteur : proteger plus de temps tant que la tournee n est pas familiere.',
              'Fin de journee : garder assez d espace pour ne pas ramener les retards chez soi.',
            ],
          },
          {
            heading: 'Laisser les marges guider ce que voit le client',
            paragraphs: [
              'Si les marges existent seulement dans votre tete, la page de reservation peut encore proposer des creneaux fragiles. Le meilleur systeme garde ces marges dans la logique de disponibilite.',
              'Ainsi, les clients voient des options qui respectent deja la realite operationnelle de la journee. Le planning devient plus fiable parce qu il inclut le travail cache.',
            ],
          },
          {
            heading: 'Revoir les marges quand la semaine pese',
            paragraphs: [
              'Si vous arrivez souvent en retard, sautez les pauses ou vous sentez presse apres certains services, les regles de marge sont probablement trop optimistes. Si de grands trous apparaissent chaque semaine, elles sont peut-etre trop prudentes.',
              'La bonne marge n est pas un nombre universel. C est la plus petite marge qui rend la journee regulierement tenable.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'service-area-planning',
    publishedAt: '2026-05-12',
    readingMinutes: 6,
    translations: {
      en: {
        slug: 'dog-trainer-service-area-planning',
        category: 'Operations',
        title: 'How to define service areas without making your calendar rigid',
        description:
          'A practical way for dog trainers to use zones, travel limits, and flexible exceptions without turning availability into a maze.',
        excerpt:
          'A service area should protect the week, not trap the business. The right zones make booking clearer while still leaving room for judgment.',
        tags: ['Travel', 'Service areas', 'Planning'],
        coverImage: {
          src: '/blog/covers/service-areas.svg',
          alt: 'Map-inspired service area planning board for a dog trainer',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Make travel rules easier to apply',
        ctaDescription:
          'MagicHango helps dog trainers keep booking options aligned with real travel constraints and weekly capacity.',
        ctaLabel: 'Plan cleaner routes',
        sections: [
          {
            heading: 'A good service area starts with the week you want to protect',
            paragraphs: [
              'Many trainers define their service area by distance from home. That is a useful start, but it does not always reflect how the week actually works. A thirty-minute drive can be easy on Tuesday morning and painful on Friday afternoon if it breaks the rest of the route.',
              'Instead of drawing one hard circle, start by identifying the days, zones, and time windows that keep the business healthy. The map should serve the operating rhythm, not the other way around.',
            ],
          },
          {
            heading: 'Separate normal zones from exception zones',
            paragraphs: [
              'It is easier to stay flexible when exceptions are named in advance. A normal zone is where you can book without hesitation. An exception zone is possible, but only when it fits a stronger route, a higher-value service, or a client relationship that justifies the extra movement.',
              'This protects the calendar without making your public availability feel cold or closed. Clients still see a clear booking path, while you keep the ability to approve the cases that make sense.',
            ],
            bullets: [
              'Core zone: easy to serve on most working days.',
              'Route zone: useful when grouped with nearby sessions.',
              'Exception zone: possible when the context is worth the travel.',
            ],
          },
          {
            heading: 'Use zones to reduce scattered decisions',
            paragraphs: [
              'The real value of service areas is not the map itself. It is the reduction of tiny decisions. When a request comes in, you should quickly know whether it is a natural fit, a conditional fit, or a polite no.',
              'That clarity also improves the client experience. People get fewer vague answers, fewer last-minute changes, and fewer appointment suggestions that later become hard to honor.',
            ],
          },
          {
            heading: 'Keep the system reviewable',
            paragraphs: [
              'Service areas should evolve with demand. Once a month, look at where sessions actually happened, where travel felt heavy, and where clients were easiest to group.',
              'If a zone regularly creates profitable, calm days, make it easier to book. If a zone regularly creates fragile routes, narrow the conditions. The best map is not the prettiest one. It is the one that helps the week stay readable.',
            ],
          },
        ],
      },
      fr: {
        slug: 'organiser-zones-intervention-educateur-canin',
        category: 'Organisation',
        title: 'Comment definir ses zones d intervention sans rigidifier son agenda',
        description:
          'Une methode pratique pour utiliser des zones, des limites de trajet et des exceptions souples sans transformer les disponibilites en labyrinthe.',
        excerpt:
          'Une zone d intervention doit proteger la semaine, pas enfermer l activite. Les bonnes zones rendent la reservation plus claire tout en gardant une marge de jugement.',
        tags: ['Trajets', 'Zones', 'Planning'],
        coverImage: {
          src: '/blog/covers/service-areas.svg',
          alt: 'Tableau de zones d intervention pour educateur canin',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Appliquer plus facilement les regles de trajet',
        ctaDescription:
          'MagicHango aide les educateurs canins a garder des propositions de reservation coherentes avec les vrais trajets et la capacite de la semaine.',
        ctaLabel: 'Planifier des tournees plus propres',
        sections: [
          {
            heading: 'Une bonne zone commence par la semaine a proteger',
            paragraphs: [
              'Beaucoup d educateurs definissent leur zone en fonction de la distance depuis leur domicile. C est un bon debut, mais cela ne reflete pas toujours la maniere dont la semaine fonctionne vraiment. Trente minutes de route peuvent etre simples le mardi matin et tres couteuses le vendredi apres-midi si elles cassent toute la tournee.',
              'Au lieu de tracer un seul cercle rigide, commencez par identifier les jours, les secteurs et les horaires qui gardent l activite saine. La carte doit servir le rythme de travail, pas l inverse.',
            ],
          },
          {
            heading: 'Distinguer les zones normales des zones d exception',
            paragraphs: [
              'Il est plus facile de rester souple lorsque les exceptions sont nommees a l avance. Une zone normale se reserve sans hesitation. Une zone d exception reste possible, mais seulement si elle s integre a une tournee solide, a une prestation plus rentable ou a une relation client qui justifie le trajet.',
              'Cela protege l agenda sans rendre les disponibilites froides ou fermees. Les clients gardent un parcours clair, et vous gardez la possibilite d accepter les cas qui ont du sens.',
            ],
            bullets: [
              'Zone coeur : facile a desservir la plupart des jours travailles.',
              'Zone de tournee : interessante lorsqu elle se regroupe avec des seances proches.',
              'Zone d exception : possible lorsque le contexte justifie le trajet.',
            ],
          },
          {
            heading: 'Utiliser les zones pour reduire les micro-decisions',
            paragraphs: [
              'La vraie valeur des zones n est pas la carte elle-meme. C est la reduction des petites decisions. Quand une demande arrive, vous devez savoir rapidement si elle est naturelle, conditionnelle ou a refuser poliment.',
              'Cette clarte ameliore aussi l experience client. Les personnes recoivent moins de reponses vagues, moins de changements de derniere minute et moins de propositions difficiles a tenir ensuite.',
            ],
          },
          {
            heading: 'Garder un systeme que l on peut reviser',
            paragraphs: [
              'Les zones doivent evoluer avec la demande. Une fois par mois, regardez ou les seances ont vraiment eu lieu, quels trajets ont pese et quels clients etaient faciles a regrouper.',
              'Si une zone cree regulierement des journees calmes et rentables, rendez-la plus facile a reserver. Si une zone cree souvent des tournees fragiles, resserrez les conditions. La meilleure carte n est pas la plus jolie. C est celle qui rend la semaine lisible.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'slot-shortlist',
    publishedAt: '2026-05-08',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'best-slots-to-offer-dog-training-clients',
        category: 'Booking',
        title: 'Why showing fewer booking slots can create a better client experience',
        description:
          'A guide to offering a focused shortlist of appointment options so clients decide faster and trainers keep a cleaner route.',
        excerpt:
          'More choice can slow clients down. A smaller set of strong slots often makes booking feel easier and keeps the day more coherent.',
        tags: ['Booking', 'Client experience', 'Availability'],
        coverImage: {
          src: '/blog/covers/slot-shortlist.svg',
          alt: 'Three recommended booking slots presented as a shortlist',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Suggest slots that make sense',
        ctaDescription:
          'MagicHango helps trainers present practical booking options instead of handing clients an overwhelming calendar.',
        ctaLabel: 'Improve booking choices',
        sections: [
          {
            heading: 'A full calendar is not always helpful',
            paragraphs: [
              'When clients see too many possible times, they often hesitate. They compare options, wonder which one is best, and may leave the booking flow to ask a question that could have been avoided.',
              'For trainers, the cost is also operational. A client may choose a technically available slot that creates a long detour, splits the day, or blocks a better cluster later.',
            ],
          },
          {
            heading: 'A shortlist turns availability into guidance',
            paragraphs: [
              'The goal is not to hide availability. The goal is to present the options that are genuinely good for both sides. A shortlist can still offer choice while removing the weakest possibilities.',
              'Three to five strong slots are often enough. They give the client autonomy, but they also communicate that the proposed times have been chosen with care.',
            ],
            bullets: [
              'Lead with slots near existing visits.',
              'Avoid isolated gaps that are hard to reuse.',
              'Keep at least one option outside peak demand when possible.',
            ],
          },
          {
            heading: 'Explain less, structure more',
            paragraphs: [
              'Clients do not need a lesson in route optimization. They need a booking page that feels obvious. If the best slots are visually clear, there is less pressure on the trainer to justify every constraint.',
              'This is where the interface matters. Good booking design quietly turns business rules into a calm decision instead of a negotiation.',
            ],
          },
          {
            heading: 'Keep manual override for sensitive cases',
            paragraphs: [
              'Some clients need a special arrangement: a first visit, a difficult situation, a family schedule, or a location that requires judgment. A shortlist should not remove the trainer from the process.',
              'The strongest setup combines guided self-booking with the ability to step in. Routine bookings stay fast, and complex bookings still get a human decision.',
            ],
          },
        ],
      },
      fr: {
        slug: 'meilleurs-creneaux-proposer-clients-education-canine',
        category: 'Reservation',
        title: 'Pourquoi afficher moins de creneaux peut ameliorer l experience client',
        description:
          'Un guide pour proposer une selection courte de rendez-vous afin que les clients choisissent plus vite et que les educateurs gardent des tournees plus propres.',
        excerpt:
          'Trop de choix peut ralentir les clients. Quelques bons creneaux rendent souvent la reservation plus simple et la journee plus coherente.',
        tags: ['Reservation', 'Experience client', 'Disponibilites'],
        coverImage: {
          src: '/blog/covers/slot-shortlist.svg',
          alt: 'Trois creneaux recommandes presentes sous forme de selection',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Proposer des creneaux qui ont du sens',
        ctaDescription:
          'MagicHango aide les educateurs a presenter des options de reservation pratiques au lieu de montrer un calendrier trop large.',
        ctaLabel: 'Ameliorer les choix de reservation',
        sections: [
          {
            heading: 'Un calendrier complet n est pas toujours utile',
            paragraphs: [
              'Quand les clients voient trop d horaires possibles, ils hesitent souvent. Ils comparent, se demandent quel choix est le meilleur, puis quittent parfois le parcours pour poser une question qui aurait pu etre evitee.',
              'Pour l educateur, le cout est aussi organisationnel. Un client peut choisir un creneau techniquement libre mais qui cree un grand detour, coupe la journee ou bloque un meilleur regroupement plus tard.',
            ],
          },
          {
            heading: 'Une selection courte transforme la disponibilite en guidage',
            paragraphs: [
              'L objectif n est pas de cacher les disponibilites. L objectif est de presenter les options qui sont vraiment bonnes pour les deux cotes. Une selection courte laisse du choix tout en retirant les possibilites les moins utiles.',
              'Trois a cinq bons creneaux suffisent souvent. Le client garde son autonomie, mais il comprend aussi que les horaires proposes ont ete choisis avec attention.',
            ],
            bullets: [
              'Mettre en avant les creneaux proches des visites deja prevues.',
              'Eviter les trous isoles difficiles a reutiliser.',
              'Garder si possible une option hors des moments les plus demandes.',
            ],
          },
          {
            heading: 'Moins expliquer, mieux structurer',
            paragraphs: [
              'Les clients n ont pas besoin d un cours d optimisation de tournee. Ils ont besoin d une page de reservation evidente. Lorsque les meilleurs creneaux sont clairs visuellement, l educateur a moins besoin de justifier chaque contrainte.',
              'C est la que l interface compte. Un bon design de reservation transforme discrètement les regles de l activite en decision calme plutot qu en negociation.',
            ],
          },
          {
            heading: 'Garder une reprise en main pour les cas sensibles',
            paragraphs: [
              'Certains clients demandent un arrangement particulier : premiere visite, situation difficile, planning familial ou adresse qui demande du jugement. Une selection courte ne doit pas retirer l educateur du processus.',
              'Le meilleur systeme combine reservation autonome guidee et possibilite d intervenir. Les reservations simples restent rapides, et les reservations complexes gardent une decision humaine.',
            ],
          },
        ],
      },
    },
  },
  {
    id: 'weekly-calendar-reset',
    publishedAt: '2026-05-03',
    readingMinutes: 5,
    translations: {
      en: {
        slug: 'weekly-calendar-reset-dog-trainers',
        category: 'Planning',
        title: 'A 20-minute weekly reset for a cleaner training calendar',
        description:
          'A simple weekly routine to review upcoming sessions, route pressure, client reminders, and the slots that should stay closed.',
        excerpt:
          'A cleaner week rarely appears by accident. A short reset helps trainers catch fragile routes before they become stressful days.',
        tags: ['Planning', 'Routine', 'Operations'],
        coverImage: {
          src: '/blog/covers/weekly-reset.svg',
          alt: 'Weekly calendar reset board with confirmed planning checks',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Keep the week readable',
        ctaDescription:
          'MagicHango brings availability, bookings, and route logic into one planning flow so the week is easier to review.',
        ctaLabel: 'Organize the week',
        sections: [
          {
            heading: 'Start before the week starts moving',
            paragraphs: [
              'The best time to clean the calendar is before messages, cancellations, and new requests start pulling the week in different directions. A short reset on Friday afternoon or Monday morning can prevent several small problems.',
              'The routine does not need to be elaborate. The point is to look at the week as a whole before reacting to individual appointments.',
            ],
          },
          {
            heading: 'Check the four pressure points',
            paragraphs: [
              'A practical reset focuses on the parts of the calendar most likely to create stress: travel, gaps, reminders, and availability that should no longer be open.',
              'Each check should lead to a tiny action. Move one proposal, close one fragile slot, confirm one address, or send one clarification before the day becomes urgent.',
            ],
            bullets: [
              'Travel: which days have the most fragile routes?',
              'Gaps: which empty blocks can be reused or protected?',
              'Reminders: which clients need practical details before the session?',
              'Open slots: which availability should be closed before it creates a bad booking?',
            ],
          },
          {
            heading: 'Protect energy, not just time',
            paragraphs: [
              'A calendar can be technically possible and still feel too heavy. The reset is a chance to notice the shape of the week: back-to-back sensitive sessions, long drives after late appointments, or too many first visits in a row.',
              'Those patterns are easy to miss when looking only at empty spaces. A weekly review helps you protect the energy needed to do good work in each session.',
            ],
          },
          {
            heading: 'Make the next decision easier',
            paragraphs: [
              'The final step is to decide what should be offered next. If Tuesday is already dense, maybe the next client should see Wednesday. If a route is forming in one area, maybe the next slot should support it.',
              'A weekly reset works because it turns the calendar from a passive list into an active plan. The week becomes easier to adjust because the main constraints are already visible.',
            ],
          },
        ],
      },
      fr: {
        slug: 'routine-hebdomadaire-planning-educateur-canin',
        category: 'Planning',
        title: 'Une routine de 20 minutes pour garder un planning plus propre',
        description:
          'Une routine hebdomadaire simple pour verifier les seances a venir, la pression des trajets, les rappels clients et les creneaux a fermer.',
        excerpt:
          'Une semaine propre apparait rarement par hasard. Une courte revue aide les educateurs a repérer les tournees fragiles avant qu elles deviennent stressantes.',
        tags: ['Planning', 'Routine', 'Organisation'],
        coverImage: {
          src: '/blog/covers/weekly-reset.svg',
          alt: 'Tableau de routine hebdomadaire pour planning educateur canin',
          width: 1600,
          height: 900,
        },
        ctaTitle: 'Garder une semaine lisible',
        ctaDescription:
          'MagicHango rassemble disponibilites, reservations et logique de trajet dans un meme flux pour rendre la semaine plus simple a relire.',
        ctaLabel: 'Organiser la semaine',
        sections: [
          {
            heading: 'Commencer avant que la semaine bouge',
            paragraphs: [
              'Le meilleur moment pour nettoyer le planning se situe avant que les messages, les annulations et les nouvelles demandes commencent a tirer la semaine dans tous les sens. Une courte revue le vendredi apres-midi ou le lundi matin peut eviter plusieurs petits problemes.',
              'La routine n a pas besoin d etre complexe. L idee est de regarder la semaine dans son ensemble avant de reagir rendez-vous par rendez-vous.',
            ],
          },
          {
            heading: 'Verifier les quatre points de pression',
            paragraphs: [
              'Une revue utile se concentre sur les parties du planning qui creent le plus souvent du stress : les trajets, les trous, les rappels et les disponibilites qui ne devraient plus etre ouvertes.',
              'Chaque verification doit mener a une petite action. Deplacer une proposition, fermer un creneau fragile, confirmer une adresse ou envoyer une precision avant que la journee devienne urgente.',
            ],
            bullets: [
              'Trajets : quels jours ont les tournees les plus fragiles ?',
              'Trous : quels blocs vides peuvent etre reutilises ou proteges ?',
              'Rappels : quels clients ont besoin de details pratiques avant la seance ?',
              'Creneaux ouverts : quelles disponibilites faut-il fermer avant qu elles creent une mauvaise reservation ?',
            ],
          },
          {
            heading: 'Proteger l energie, pas seulement le temps',
            paragraphs: [
              'Un planning peut etre techniquement possible tout en restant trop lourd. La revue permet de voir la forme de la semaine : seances sensibles en chaine, longs trajets apres des rendez-vous tardifs ou trop de premieres visites a la suite.',
              'Ces tendances sont faciles a manquer lorsque l on regarde seulement les espaces libres. Une revue hebdomadaire aide a proteger l energie necessaire pour bien travailler pendant chaque seance.',
            ],
          },
          {
            heading: 'Rendre la prochaine decision plus facile',
            paragraphs: [
              'La derniere etape consiste a decider ce qu il faut proposer ensuite. Si le mardi est deja dense, le prochain client devrait peut-etre voir le mercredi. Si une tournee se forme dans un secteur, le prochain creneau devrait peut-etre la renforcer.',
              'La routine fonctionne parce qu elle transforme le planning d une liste passive en plan actif. La semaine devient plus facile a ajuster parce que les contraintes principales sont deja visibles.',
            ],
          },
        ],
      },
    },
  },
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
