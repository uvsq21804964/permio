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
