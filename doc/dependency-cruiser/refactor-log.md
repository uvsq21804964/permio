# Refactor Log

## 2026-04-18 - Lots FE-1 / FE-2

### Périmètre

- Mise en place de la base réseau front côté client.
- Refactor du domaine `services`.
- Rebranchement des callers `book` qui chargeaient `/api/me/instructor-services`.
- Correction de bloqueurs TypeScript globaux pour restaurer une base compilable.

### Fichiers créés

- `lib/client/api/request.ts`
- `lib/client/api/services-client.ts`
- `lib/client/api/me-client.ts`
- `lib/client/hooks/useInstructorServices.ts`
- `lib/client/hooks/useEditableServices.ts`
- `components/services/EditableServicesCatalog.tsx`
- `components/services/ServiceFormDialog.tsx`
- `components/services/CategoryFormDialog.tsx`
- `components/services/SelectableServicesCatalog.tsx`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/services/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(educator)/layout.tsx`
- `app/[locale]/(routes)/(routes)/(app)/layout.tsx`
- `app/[locale]/(routes)/(routes)/layout.tsx`
- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`
- `app/[locale]/(routes)/sign-in/[[...sign-in]]/page.tsx`
- `app/api/webhook/route.ts`
- `app/api/stripe/webhook/route.ts`
- `components/availability/WeeklyGlobalAgenda.tsx`
- `lib/mock-db.ts`
- `lib/stripe.ts`
- `src/i18n/clerk.ro.ts`

### Appels API déplacés dans les clients

- `/api/me/services` vers `lib/client/api/services-client.ts`
- `/api/me/instructor-services` vers `lib/client/api/services-client.ts`
- `/api/me/profile` vers `lib/client/api/me-client.ts`

### Hooks créés

- `useInstructorServices`
- `useEditableServices`

### Vérification de cartographie API

- `dependency-api-contracts.json` a été relu avant le lot.
- Routes couvertes pour `services` :
  - `/api/me/services`
  - `/api/me/instructor-services`
- Callers front rebranchés :
  - `app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx`
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/services/page.tsx`
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx`
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`

### Contrats HTTP préservés

- Endpoints inchangés.
- Méthodes HTTP inchangées.
- Payloads envoyés inchangés.
- Shapes attendues côté front conservées.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation manuelle non faite dans cette session pour :
  - création/modification/suppression de services côté éducateur
  - navigation `book/services -> book/address -> book/proposals`
  - redirection des services `remote` depuis `book/address`
- `book/page.tsx` et `book/proposals/page.tsx` ont encore leur logique agenda/réservation locale, même si le chargement du catalogue service a été centralisé.

### Vérifications manuelles à refaire

- `services` :
  - créer une catégorie
  - créer un service
  - modifier un service
  - supprimer un service
  - vérifier le cas `CATEGORY_HAS_SERVICES`
- `book/services` :
  - affichage du catalogue
  - sélection d’un service remote et non remote
- `book/address` :
  - chargement de l’adresse sauvegardée
  - redirection automatique si le service est remote
- `book/proposals` :
  - chargement du service sélectionné depuis le hook

## 2026-04-18 - Lot FE-3 (sous-lot availability)

### Périmètre

- Mise en place de la couche client `availability`.
- Création des hooks de domaine `availability`.
- Rebranchement de `availability/page`, `availability-agenda`, `DailyOverridesCard` et `WeeklyGlobalAgenda`.
- Sous-lot volontairement limité: `associate-agency-availability.tsx` reste pour la suite.

### Fichiers créés

- `lib/client/api/availabilities-client.ts`
- `lib/client/hooks/useAvailabilityRoleGate.ts`
- `lib/client/hooks/useWeeklyAvailabilities.ts`
- `lib/client/hooks/useDayOverrides.ts`

### Fichiers modifiés

- `lib/client/api/me-client.ts`
- `app/[locale]/(routes)/(routes)/(app)/(educator)/availability/page.tsx`
- `components/availability-agenda.tsx`
- `components/availability/DailyOverridesCard.tsx`
- `components/availability/WeeklyGlobalAgenda.tsx`

### Appels API déplacés dans les clients

- `/api/me/role` vers `lib/client/api/me-client.ts`
- `/api/me/hours` vers `lib/client/api/me-client.ts`
- `/api/availabilities` vers `lib/client/api/availabilities-client.ts`
- `/api/availabilities/day` vers `lib/client/api/availabilities-client.ts`
- `/api/availabilities/day/[id]` vers `lib/client/api/availabilities-client.ts`
- `/api/slots/week` vers `lib/client/api/availabilities-client.ts`
- `/api/travels/week` vers `lib/client/api/availabilities-client.ts`

### Hooks créés

- `useAvailabilityRoleGate`
- `useWeeklyAvailabilities`
- `useDayOverrides`

### Vérification de cartographie API

- `dependency-api-contracts.json` a été relu pour :
  - `/api/availabilities`
  - `/api/availabilities/day`
  - `/api/availabilities/all`
  - `/api/availabilities/bulk`
- Callers rebranchés dans ce sous-lot :
  - `app/[locale]/(routes)/(routes)/(app)/(educator)/availability/page.tsx`
  - `components/availability-agenda.tsx`
  - `components/availability/WeeklyGlobalAgenda.tsx`
  - `components/availability/DailyOverridesCard.tsx`
- Caller laissé pour le sous-lot suivant :
  - `components/associate-agency-availability.tsx`

### Contrats HTTP préservés

- Endpoints inchangés.
- Méthodes HTTP inchangées.
- Paramètres de query inchangés.
- Payloads inchangés.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- `associate-agency-availability.tsx` n’a pas encore été déplacé sur la nouvelle couche client.
- `availability-agenda.tsx` reste un gros composant malgré la sortie du réseau.
- La suppression des disponibilités hebdomadaires continue d’appeler `/api/availabilities/:id`, ce qui mérite une validation manuelle attentive puisque cette route n’a pas été revue dans ce sous-lot.

### Vérifications manuelles à refaire

- `availability/page` :
  - bascule `configure/global`
  - forcing de la vue globale pour un student
- `availability-agenda` :
  - chargement des disponibilités
  - ajout d’une ou plusieurs plages
  - suppression d’une plage
  - affichage des heures restantes pour un student
- `DailyOverridesCard` :
  - chargement par date
  - chargement des overrides à venir
  - création d’un override available/unavailable
  - suppression d’un override
- `WeeklyGlobalAgenda` :
  - chargement semaine
  - affichage exceptions / slots / travels
  - navigation semaine précédente/suivante

## 2026-04-18 - Lot FE-5 (sous-lot booking)

### Périmètre

- Création du client API `booking`.
- Création des hooks `booking` pour l’agenda instructeur et la mutation de réservation.
- Rebranchement de `book/page.tsx` et `book/proposals/page.tsx`.

### Fichiers créés

- `lib/client/api/booking-client.ts`
- `lib/client/hooks/useBookingServices.ts`
- `lib/client/hooks/useInstructorWeeklyAgenda.ts`
- `lib/client/hooks/useInstructorProposalAgenda.ts`
- `lib/client/hooks/useBookSlot.ts`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`
- `lib/client/api/booking-client.ts`
- `lib/client/hooks/useInstructorWeeklyAgenda.ts`
- `lib/client/hooks/useInstructorProposalAgenda.ts`

### Appels API déplacés dans les clients

- `/api/me/instructor-weekly-agenda` vers `lib/client/api/booking-client.ts`
- `/api/me/instructor-weekly-agenda-proposals` vers `lib/client/api/booking-client.ts`
- `/api/slots` vers `lib/client/api/booking-client.ts`

### Hooks créés

- `useBookingServices`
- `useInstructorWeeklyAgenda`
- `useInstructorProposalAgenda`
- `useBookSlot`

### Contrats HTTP préservés

- Endpoints inchangés.
- Query params `weekStart`, `clientLat`, `clientLng`, `clientFormatted`, `isRemote` conservés.
- Payload de création de slot inchangé.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- `book/address/page.tsx` reste sur une logique locale de flux d’adresse, même si les appels `services` et `profile` ont déjà été sortis.
- Le flow partagé de réservation n’est pas encore porté par un state model commun.

### Vérifications manuelles à refaire

- `book/page` :
  - chargement de l’agenda hebdo
  - navigation semaine précédente/suivante
  - réservation d’un slot
  - cas `SLOT_ALREADY_EXISTS`
- `book/proposals` :
  - chargement des propositions
  - réservation d’une proposition
  - navigation vers `/myweek`

## 2026-04-18 - Lot FE-4 (sous-lot users / gestion)

### Périmètre

- Création du client API `users`.
- Création des hooks de chargement et mutation pour `users`.
- Rebranchement de `UserManagement`, `optimal-schedule` et `CalculatedAgendaSection`.

### Fichiers créés

- `lib/client/api/users-client.ts`
- `lib/client/hooks/useAgencyUsers.ts`
- `lib/client/hooks/useUserRoleMutations.ts`
- `lib/client/hooks/useStudentHoursMutations.ts`

### Fichiers modifiés

- `components/gestion/UserManagement.tsx`
- `components/optimal-schedule.tsx`
- `components/schedule/CalculatedAgendaSection.tsx`

### Appels API déplacés dans les clients

- `/api/users` vers `lib/client/api/users-client.ts`
- `/api/users/[id]` vers `lib/client/api/users-client.ts`
- `/api/users/[id]/role` vers `lib/client/api/users-client.ts`
- `/api/users/[id]/hours` vers `lib/client/api/users-client.ts`

### Hooks créés

- `useAgencyUsers`
- `useUserRoleMutations`
- `useStudentHoursMutations`

### Contrats HTTP préservés

- Endpoints inchangés.
- Header `x-org-id` conservé.
- Méthodes PATCH/PUT/DELETE inchangées.
- Payloads de rôle et d’heures inchangés.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- `UserManagement.tsx` reste monolithique visuellement même si les accès réseau sont sortis.
- `StudentsAvailabilityHeatmap.tsx` n’a pas encore été rebranché sur la couche client.

### Vérifications manuelles à refaire

- `UserManagement` :
  - chargement de la liste
  - promotion / rétrogradation
  - suppression d’un user
  - ajout d’1h
  - édition des heures
- `OptimalSchedule` :
  - chargement des élèves
- `CalculatedAgendaSection` :
  - chargement de la liste de membres
  - suppression d’un élève depuis la légende

## 2026-04-18 - Lot FE-6 (sous-lot myweek / schedule)

### Périmètre

- Création du client API `schedule`.
- Création des hooks `useMyWeeks` et `useCommitSchedule`.
- Rebranchement de `LastWeekAgenda`, `OptimalSchedule` et `CalculatedAgendaSection`.

### Fichiers créés

- `lib/client/api/schedule-client.ts`
- `lib/client/hooks/useMyWeeks.ts`
- `lib/client/hooks/useCommitSchedule.ts`

### Fichiers modifiés

- `components/schedule/LastWeekAgenda.tsx`
- `components/optimal-schedule.tsx`
- `components/schedule/CalculatedAgendaSection.tsx`

### Appels API déplacés dans les clients

- `/api/me/weeks` vers `lib/client/api/schedule-client.ts`
- `/api/schedule` vers `lib/client/api/schedule-client.ts`
- `/api/schedule/commit` vers `lib/client/api/schedule-client.ts`
- `/api/me/services` réutilisé via `lib/client/api/services-client.ts` dans `LastWeekAgenda`

### Hooks créés

- `useMyWeeks`
- `useCommitSchedule`

### Contrats HTTP préservés

- Endpoints inchangés.
- Query params `userId` et `weekStart` conservés.
- Payload `matches` / `scope` conservé pour `/api/schedule/commit`.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- `LastWeekAgenda.tsx` reste un composant volumineux, même si son réseau est sorti.
- Le hook `useCalculatedAgenda` prévu au plan n’est pas encore isolé.

### Vérifications manuelles à refaire

- `myweek` :
  - chargement de la semaine
  - navigation semaine précédente/suivante
  - affichage des prochains cours
  - affichage du code d’association
- `OptimalSchedule` :
  - génération de planning
- `CalculatedAgendaSection` :
  - validation des moniteurs

## 2026-04-19 - Lot FE-7 (profile / onboarding) + finalisation availability/users

### Périmètre

- Création du client API `profile`.
- Mutualisation des helpers front d'adresse et de chargement Google Maps.
- Rebranchement de `profile`, `onboarding/choose-organization`, `associate-agency-availability` et `StudentsAvailabilityHeatmap`.
- Fermeture des callers restants identifiés dans `dependency-api-contracts.json` pour `/api/me/account_bdd`, `/api/agency/association`, `/api/onboarding/trainer`, `/api/availabilities/bulk` et `/api/availabilities/all`.

### Fichiers créés

- `lib/client/api/profile-client.ts`
- `lib/client/utils/address.ts`
- `lib/client/utils/google-maps.ts`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`
- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`
- `components/associate-agency-availability.tsx`
- `components/gestion/StudentsAvailabilityHeatmap.tsx`
- `lib/client/api/availabilities-client.ts`
- `lib/client/utils/google-maps.ts`

### Appels API déplacés dans les clients

- `/api/me/profile` vers `lib/client/api/profile-client.ts`
- `/api/me/delete-account` vers `lib/client/api/profile-client.ts`
- `/api/me/account_bdd` vers `lib/client/api/profile-client.ts`
- `/api/agency/association` vers `lib/client/api/profile-client.ts`
- `/api/onboarding/trainer` vers `lib/client/api/profile-client.ts`
- `/api/availabilities/bulk` vers `lib/client/api/availabilities-client.ts`
- `/api/availabilities/all` vers `lib/client/api/availabilities-client.ts`

### Hooks créés

- Aucun nouveau hook sur ce lot.

### Vérification de cartographie API

- `dependency-api-contracts.json` a été relu avant le lot.
- Callers rebranchés :
  - `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`
  - `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`
  - `components/associate-agency-availability.tsx`
  - `components/gestion/StudentsAvailabilityHeatmap.tsx`

### Contrats HTTP préservés

- Endpoints inchangés.
- Méthodes HTTP inchangées.
- Payloads de profil, d'association agence et d'onboarding éducateur conservés.
- Les helpers d'adresse n'introduisent pas d'adaptateur de shape côté transport.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation manuelle non faite pour l'autocomplete Google Places sur `profile`, `onboarding` et `book/address`.
- `profile/page.tsx` reste volumineux malgré la sortie du réseau et des helpers d'adresse.
- `associate-agency-availability.tsx` reste un gros composant d'édition malgré la centralisation des appels API.

### Vérifications manuelles à refaire

- `profile` :
  - chargement du profil
  - modification du nom
  - modification de l'adresse avec suggestion Google
  - suppression de compte

## 2026-04-19 - Lot FE-7 sexies (book page orchestration hook)

### PÃ©rimÃ¨tre

- Extraction de l'orchestration de `book/page.tsx` dans un hook dÃ©diÃ©.
- DÃ©placement du pilotage semaine / sÃ©lection de crÃ©neau / rÃ©servation / alignement d'adresse hors du composant de rendu.
- Conservation du rendu, des query params et des contrats HTTP existants.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useBookPageState.ts`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les accÃ¨s restent portÃ©s par :
  - `useBookingServices`
  - `useInstructorWeeklyAgenda`
  - `useBookSlot`

### Hooks crÃ©Ã©s

- `useBookPageState`

### VÃ©rification de cartographie API

- Aucun changement sur :
  - `/api/me/instructor-services`
  - `/api/me/instructor-weekly-agenda`
  - `/api/slots`

### Contrats HTTP prÃ©servÃ©s

- Query params de booking inchangÃ©s.
- Payload de rÃ©servation inchangÃ©.
- Structure de rÃ©ponse agenda inchangÃ©e.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-EXACT-DATA

### PÃ©rimÃ¨tre

- Reprise de la page `magic-hango` Ã  partir d'un jeu de donnÃ©es mÃ©tier explicite.
- Alignement de la dÃ©mo sur deux agendas exacts `sans / avec MagicHango`.

### Fichiers modifiÃ©s

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements rÃ©alisÃ©s

- Remplacement du contenu gÃ©nÃ©rique par les horaires exacts fournis pour les deux journÃ©es.
- Ajout des bilans complets `sans / avec MagicHango`.
- Ajout de la table de comparaison directe avec les gains attendus.
- Reprise du message marketing FR/EN pour coller au positionnement demandÃ©.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.
- Aucun appel API ajoutÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-SERVER-I18N

### PÃ©rimÃ¨tre

- SÃ©curisation du rendu des traductions de la dÃ©mo `magic-hango`.

### Fichiers modifiÃ©s

- `components/magic-hango/OptimizationDemo.tsx`

### Changements rÃ©alisÃ©s

- Passage de la dÃ©mo d'un composant client Ã  un composant rendu cÃ´tÃ© serveur.
- RÃ©solution directe des traductions via `getTranslations('magicHango')`.
- Suppression de la dÃ©pendance du mini agenda au provider client pour Ã©viter l'affichage brut de clÃ©s comme `magicHango.simple.before.slots.sessionOne.title`.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-NO-OVERLAP

### PÃ©rimÃ¨tre

- Correction du rendu des durÃ©es dans le mini agenda `magic-hango`.

### Fichiers modifiÃ©s

- `components/magic-hango/OptimizationDemo.tsx`

### Changements rÃ©alisÃ©s

- Passage Ã  une hauteur exacte par crÃ©neau au lieu d'une `minHeight` qui uniformisait les blocs.
- Suppression du dÃ©calage vertical artificiel qui contribuait aux chevauchements.
- Ajout d'un rendu compact spÃ©cifique pour les trajets et crÃ©neaux courts afin qu'ils restent lisibles sans forcer une hauteur trop grande.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-MORPH

### PÃ©rimÃ¨tre

- Ajout d'une transformation animÃ©e entre la journÃ©e `sans` et `avec` MagicHango.

### Fichiers modifiÃ©s

- `components/magic-hango/AnimatedAgendaShowcase.tsx`
- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements rÃ©alisÃ©s

- CrÃ©ation d'un composant client dÃ©diÃ© pour animer le passage d'un agenda cassÃ© Ã  une tournÃ©e optimisÃ©e.
- DÃ©placement, redimensionnement et transformation visuelle des crÃ©neaux pendant la transition.
- Ajout d'un contrÃ´le explicite pour rejouer le passage `sans -> avec` et revenir en arriÃ¨re.
- Conservation des bilans et de la table de comparaison sous la dÃ©mo animÃ©e.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.
- Aucun appel API ajoutÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot I18N-DEV-CACHE

### PÃ©rimÃ¨tre

- Fiabilisation du rechargement des messages `next-intl` en dÃ©veloppement.

### Fichiers modifiÃ©s

- `src/i18n/getMessages.ts`

### Changements rÃ©alisÃ©s

- DÃ©sactivation du cache mÃ©moire des messages par locale en environnement de dÃ©veloppement.
- Conservation du cache en production.
- Correction des cas oÃ¹ de nouvelles clÃ©s JSON restaient invisibles et s'affichaient brutes aprÃ¨s modification des fichiers de messages.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-LOCALE-LOCK

### PÃ©rimÃ¨tre

- Verrouillage explicite de la locale sur la page `magic-hango`.

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/magic-hango/page.tsx`
- `components/magic-hango/OptimizationDemo.tsx`

### Changements rÃ©alisÃ©s

- Passage de la locale d'URL au rendu serveur de la page.
- Utilisation de `getTranslations({ locale, namespace: 'magicHango' })` au lieu d'une rÃ©solution implicite.
- Suppression du fallback silencieux vers l'anglais observÃ© sur `/fr/magic-hango`.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-SPLIT-PANEL

### PÃ©rimÃ¨tre

- SÃ©paration du bloc agenda `magic-hango` en deux zones lisibles.

### Fichiers modifiÃ©s

- `components/magic-hango/AnimatedAgendaShowcase.tsx`
- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements rÃ©alisÃ©s

- Agenda visuel isolÃ© dans la colonne de gauche.
- Panneau d'explication dÃ©diÃ© dans la colonne de droite avec bouton d'action, texte courant et raisons concrÃ¨tes de la transformation.
- Ajout de microcopies explicites sur l'Ã©loignement des clients, les trous perdus et le retour au domicile.

### Contrats HTTP

- Aucun contrat HTTP modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle encore nÃ©cessaire sur la navigation semaine prÃ©cÃ©dente / suivante et le dialogue d'alignement d'adresse.

### VÃ©rifications manuelles Ã  refaire

- `book` :
  - chargement service par query param
  - navigation entre semaines
  - sÃ©lection de crÃ©neau
  - rÃ©servation avec et sans dialogue d'alignement

## 2026-04-19 - Lot FE-7 septies (dev-only logger et rÃ©duction des logs verbeux)

### PÃ©rimÃ¨tre

- Ajout d'un logger `dev-only` partagÃ© entre client et serveur.
- Remplacement des `console.log` restants et encapsulation des traces de debug trop verbeuses dans les services agenda / Stripe.
- Conservation des comportements mÃ©tier, des routes et des contrats HTTP.

### Fichiers crÃ©Ã©s

- `lib/shared/dev-logger.ts`

### Fichiers modifiÃ©s

- `src/i18n/getMessages.ts`
- `lib/get-data.ts`
- `lib/server/services/agenda-travel.ts`
- `lib/server/services/instructor-agenda-service.ts`
- `lib/server/services/billing-page-stripe.ts`
- `lib/client/hooks/useBookPageState.ts`
- `app/api/schedule/route.ts`
- `app/api/stripe/checkout/route.ts`

### Changements principaux

- Centralisation des logs de debug derriÃ¨re `devLogger`.
- Suppression des `console.log` directs dans `app`, `lib`, `src` et `components`.
- RÃ©duction du bruit serveur sur les flux agenda, checkout Stripe et billing sans impacter les payloads ni les statuts.

### VÃ©rification de cartographie API

- Aucun changement sur :
  - `/api/schedule`
  - `/api/stripe/checkout`
  - les services agenda consommÃ©s par `/api/me/instructor-weekly-agenda`

### Contrats HTTP prÃ©servÃ©s

- Aucun changement de query params.
- Aucun changement de payload ou de codes de retour.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Les `console.error` mÃ©tier restent volontairement prÃ©servÃ©s hors de ce lot ; une passe spÃ©cifique resterait possible si l'objectif devient une politique de logging globale.

### VÃ©rifications manuelles Ã  refaire

- `book` :
  - sÃ©lection d'un crÃ©neau puis rÃ©servation
- `invoices` :
  - affichage du banner abonnement / trial
- `checkout Stripe` :
  - crÃ©ation de session et redirection

## 2026-04-19 - Lot BE-8 (extraction du service de booking slots)

### PÃ©rimÃ¨tre

- Sortie de la logique de crÃ©ation de slot hors de `app/api/slots/route.ts`.
- CrÃ©ation d'un repository dÃ©diÃ© pour la lecture et l'insertion des slots.
- Centralisation de la validation, de la rÃ©solution instructeur/agence, du mapping d'adresse et de l'Ã©mission des Ã©vÃ©nements Inngest dans un service serveur.

### Fichiers crÃ©Ã©s

- `lib/server/repositories/slot-repository.ts`
- `lib/server/services/slot-booking-service.ts`

### Fichiers modifiÃ©s

- `app/api/slots/route.ts`

### Changements principaux

- La route `GET /api/slots` s'appuie dÃ©sormais sur un repository ciblÃ©.
- La route `POST /api/slots` devient un simple adaptateur HTTP.
- La logique mÃ©tier de booking et les Ã©vÃ©nements `slot/booked-*` sont encapsulÃ©s dans `createSlotBooking`.

### VÃ©rification de cartographie API

- Aucun changement sur :
  - `/api/slots`
  - les payloads `slot/booked-instructor`
  - les payloads `slot/booked-client`

### Contrats HTTP prÃ©servÃ©s

- Corps JSON attendus inchangÃ©s.
- Codes de retour `400/409/500` inchangÃ©s.
- Structure `{ slot: ... }` en succÃ¨s inchangÃ©e.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle encore utile sur la crÃ©ation de rÃ©servation avec adresse distante ou adresse profil.

### VÃ©rifications manuelles Ã  refaire

- `book` :
  - rÃ©servation client simple
  - rÃ©servation avec `bookingAddress`
  - conflit de doublon `SLOT_ALREADY_EXISTS`

## 2026-04-19 - Lot FE-8 (state model onboarding choose-organization)

### PÃ©rimÃ¨tre

- Extraction de l'orchestration de `app/[locale]/(routes)/onboarding/choose-organization/page.tsx` dans un hook dÃ©diÃ©.
- DÃ©placement de l'Ã©tat UI, des effets de redirect, du flow Google Places et des handlers client / trainer hors du composant de rendu.
- Conservation du rendu et des contrats HTTP existants.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useAssociateAgencyPageState.tsx`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`

### Changements principaux

- La page d'onboarding devient principalement compositionnelle.
- Le flow multi-Ã©tapes client / trainer, la gestion d'adresse et la soumission sont pilotÃ©s par `useAssociateAgencyPageState`.
- La gestion de chargement / blocage / redirect est centralisÃ©e dans le hook.

### VÃ©rification de cartographie API

- Aucun changement sur :
  - `/api/agency/association`
  - `/api/me/profile`
  - les accÃ¨s Google Places cÃ´tÃ© client

### Contrats HTTP prÃ©servÃ©s

- Payload client d'association inchangÃ©.
- Parcours trainer inchangÃ©.
- Redirections mÃ©tier inchangÃ©es.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle encore recommandÃ©e sur le flow complet client puis trainer, surtout autour du chargement Google Maps et de la redirection compte dÃ©jÃ  configurÃ©.

### VÃ©rifications manuelles Ã  refaire

- `choose-organization` :
  - mode client
  - mode trainer
  - retour de l'Ã©tape disponibilitÃ© vers l'Ã©tape adresse
  - redirect si compte dÃ©jÃ  configurÃ©

## 2026-04-19 - Lot BE-9 (mutualisation email Inngest)

### PÃ©rimÃ¨tre

- Mutualisation des helpers communs des fonctions email Inngest.
- Centralisation de la locale email, de l'URL applicative, du chargement Clerk et de l'envoi Resend.
- RÃ©duction des logs redondants d'information via un logger partagÃ©.

### Fichiers crÃ©Ã©s

- `src/lib/inngest/functions/email-shared.ts`

### Fichiers modifiÃ©s

- `src/lib/inngest/functions/newClient.ts`
- `src/lib/inngest/functions/welcomeClientEmail.ts`
- `src/lib/inngest/functions/slotBookedInstructorEmail.ts`
- `src/lib/inngest/functions/slotBookedClientEmail.ts`

### Changements principaux

- Extraction de `getPrimaryEmail`, `loadClerkUserContact`, `sendTransactionalEmail`, `toEmailLocale` et `buildLocalizedAppUrl`.
- Simplification des quatre fonctions email sans changer leurs Ã©vÃ©nements ni leur rendu React Email.
- Passage des logs informatifs rÃ©pÃ©titifs vers un logger plus discret hors production.

### VÃ©rification de cartographie API

- Aucun changement sur les Ã©vÃ©nements :
  - `agency/member-joined`
  - `agency/client-welcome`
  - `slot/booked-instructor`
  - `slot/booked-client`

### Contrats HTTP prÃ©servÃ©s

- Aucun endpoint HTTP modifiÃ©.
- Aucun payload d'Ã©vÃ©nement modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle utile sur les notifications email en environnement d'intÃ©gration, surtout pour confirmer les fallback de nom et d'adresse email.

### VÃ©rifications manuelles Ã  refaire

- `emails` :
  - nouveau client
  - bienvenue client
  - notification instructeur aprÃ¨s booking
  - confirmation client aprÃ¨s booking

## 2026-04-19 - Lot HY-8 (nettoyage knip conservateur)

### PÃ©rimÃ¨tre

- Suppression des reliquats de refactor et des modules morts sans rÃ©fÃ©rence restante.
- Nettoyage prudent de `package.json` sur une dÃ©pendance devenue inutile.
- Relecture `knip` aprÃ¨s nettoyage pour mesurer le reliquat restant.

### Fichiers supprimÃ©s

- `lib/agency-guards.ts`
- `lib/mock-db.ts`
- `lib/api/auth.ts`
- `lib/api/time.ts`
- `src/components/LocaleLink.tsx`
- `src/i18n/clerk.ro.ts`
- `refactor-lot-1/README.md`
- `refactor-lot-1/lib/api/auth-server.ts`
- `refactor-lot-1/lib/server/domain/time-ranges.ts`
- `refactor-lot-1/lib/server/repositories/agency-repository.ts`
- `refactor-lot-1/lib/server/repositories/user-repository.ts`

### Fichiers modifiÃ©s

- `package.json`

### Changements principaux

- Retrait des reliquats `refactor-lot-1`.
- Suppression de helpers historiques non rÃ©fÃ©rencÃ©s.
- Suppression de `@clerk/types` en dÃ©pendance directe.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### ContrÃ´le knip

- Commande exÃ©cutÃ©e : `cmd /c npx knip`
- RÃ©sultat : reliquat rÃ©duit, il reste surtout :
  - 6 fichiers inutilisÃ©s
  - `dependency-cruiser` signalÃ© comme devDependency inutilisÃ©e
  - des exports/types publics non consommÃ©s

### Risques restants

- Les fichiers encore signalÃ©s par `knip` mÃ©ritent une validation produit/outillage avant suppression, en particulier les composants home et les scripts `dependency-cruiser`.
- `onboarding/choose-organization` :
  - onboarding client avec code agence
  - onboarding éducateur jusqu'à la validation des disponibilités
  - redirection si le compte existe déjà
- `StudentsAvailabilityHeatmap` :
  - chargement du heatmap
  - cas sans disponibilités

## 2026-04-19 - Lot FE-8 (home / marketing / nav)

### Périmètre

- Rationalisation de la navigation desktop/mobile via des utilitaires partagés.
- Sortie du chargement abonnement du composant `PlansSansSimulation`.
- Allègement de `home/page.tsx` avec un composant de statut réutilisable.

### Fichiers créés

- `components/navbar/navbar-utils.ts`
- `components/home/HomeStatusCard.tsx`
- `lib/client/hooks/useMySubscriptionStatus.ts`

### Fichiers modifiés

- `app/[locale]/(routes)/home/page.tsx`
- `app/[locale]/(routes)/(routes)/layout.tsx`
- `components/home/PlansSansSimulation.tsx`
- `components/navbar/navbar_desktop.tsx`
- `components/navbar/navbar_mobile.tsx`
- `lib/client/api/me-client.ts`

### Appels API déplacés dans les clients

- `/api/me/subscription` vers `lib/client/api/me-client.ts`

### Hooks créés

- `useMySubscriptionStatus`

### Vérification de cartographie API

- `dependency-api-contracts.json` a été relu pour le caller `components/home/PlansSansSimulation.tsx`.
- Aucun contrat API supplémentaire n'a été touché côté navigation.

### Contrats HTTP préservés

- Endpoint `/api/me/subscription` inchangé.
- Requête `GET` conservée avec `cache: 'no-store'`.
- Les formulaires Stripe du home restent inchangés.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation responsive manuelle encore à faire sur `home`, `navbar_desktop` et `navbar_mobile`.
- Le home garde sa structure marketing existante; le lot a surtout visé la lisibilité et la mutualisation, pas une refonte visuelle.

### Vérifications manuelles à refaire

- `home` :
  - chargement anonyme
  - redirection quand l'utilisateur est connecté
  - CTA `sign-in` / `sign-up`
- `plans` :
  - masquage du CTA checkout si abonnement actif
  - état loading de vérification abonnement
- `navigation` :
  - filtrage des liens selon le rôle
  - ouverture/fermeture du menu profil desktop
  - ouverture/fermeture du menu mobile

## 2026-04-19 - Lot FE-7 bis (adresse / Google Maps partagÃ©s)

### PÃ©rimÃ¨tre

- Finalisation de l'extraction Google Places / Google Maps entamÃ©e sur `profile`, `onboarding` et `book/address`.
- Mutualisation du chargement de script, de l'autocomplete et de l'aperÃ§u de carte.
- Aucune modification des contrats HTTP ni des payloads dÃ©jÃ  stabilisÃ©s.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useGooglePlacesAutocomplete.ts`
- `lib/client/hooks/useGoogleMapPreview.ts`
- `components/shared/GooglePlacesScript.tsx`
- `components/shared/AddressMapPreview.tsx`

### Fichiers modifiÃ©s

- `lib/client/utils/address.ts`
- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`
- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/address/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun appel API supplÃ©mentaire dÃ©placÃ© sur ce sous-lot.
- Les pages continuent d'utiliser les clients dÃ©jÃ  crÃ©Ã©s (`me-client`, `profile-client`, `services-client`) sans changer les endpoints.

### Hooks crÃ©Ã©s

- `useGooglePlacesAutocomplete`
- `useGoogleMapPreview`

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- MÃ©thodes HTTP inchangÃ©es.
- Payloads de profil, booking address et onboarding inchangÃ©s.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle toujours nÃ©cessaire sur l'autocomplete Google Places et l'affichage carte dans `profile`, `onboarding/choose-organization` et `book/address`.
- Le hook `useGooglePlacesAutocomplete` suppose la prÃ©sence d'un script Places valide; en cas de clÃ© Google invalide, l'UI reste sur le message d'erreur existant.

### VÃ©rifications manuelles Ã  refaire

- `profile` :
  - ouverture/fermeture de la modale adresse
  - sÃ©lection d'une suggestion Google
  - mise Ã  jour de l'aperÃ§u carte aprÃ¨s sÃ©lection
- `onboarding/choose-organization` :
  - saisie client avec code agence + adresse
  - parcours Ã©ducateur jusqu'Ã  l'Ã©tape disponibilitÃ©
- `book/address` :
  - chargement de l'adresse sauvegardÃ©e
  - saisie d'une adresse personnalisÃ©e
  - rendu de la carte pour l'adresse custom

## 2026-04-19 - Lot FE-5 bis (booking flow helpers)

### PÃ©rimÃ¨tre

- Mutualisation des helpers purs du flow `booking`.
- DÃ©codage partagÃ© de l'adresse de rÃ©servation entre `book/page` et `book/proposals`.
- Rebranchement de `book/page` sur `useBookingServices` pour utiliser la mÃªme source de catalogue que `book/proposals`.

### Fichiers crÃ©Ã©s

- `lib/client/utils/booking.ts`
- `lib/client/hooks/useDecodedBookingAddress.ts`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint introduit.
- `book/page.tsx` consomme dÃ©sormais le catalogue via `useBookingServices`, lui-mÃªme adossÃ© au client `services` existant.

### Hooks crÃ©Ã©s

- `useDecodedBookingAddress`

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Query params `serviceId` et `addr` inchangÃ©s.
- Payload de crÃ©ation `POST /api/slots` inchangÃ©, uniquement factorisÃ© via `toBookingAddressPayload`.

### VÃ©rification de cartographie API

- `dependency-api-contracts.json` a Ã©tÃ© relu pour le domaine `booking`.
- Callers couverts dans ce sous-lot :
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
  - `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `book/page.tsx` reste un composant volumineux; le lot a surtout sorti les helpers et alignÃ© le chargement du service.
- Validation manuelle toujours nÃ©cessaire sur le flux complet `services -> address -> proposals -> book`.

### VÃ©rifications manuelles Ã  refaire

- `book/page` :
  - chargement du service depuis l'URL
  - navigation semaine prÃ©cÃ©dente/suivante
  - rÃ©servation d'un crÃ©neau avec adresse
- `book/proposals` :
  - gÃ©nÃ©ration des 3 suggestions
  - rÃ©servation depuis une suggestion
  - lien "voir tous les crÃ©neaux" avec conservation de `addr`

## 2026-04-19 - Lot FE-6 bis (LastWeekAgenda service summary)

### PÃ©rimÃ¨tre

- Extraction du chargement `services count + joinCode` hors de `LastWeekAgenda.tsx`.
- Conservation du mÃªme comportement UI pour l'affichage du code d'association et la modale "aucun service".

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useOwnServiceSummary.ts`

### Fichiers modifiÃ©s

- `components/schedule/LastWeekAgenda.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- L'appel `GET /api/me/services` reste centralisÃ© dans `services-client` et passe dÃ©sormais par `useOwnServiceSummary`.

### Hooks crÃ©Ã©s

- `useOwnServiceSummary`

### VÃ©rification de cartographie API

- `dependency-api-contracts.json` a Ã©tÃ© relu pour `/api/me/services`.
- Caller couvert dans ce sous-lot :
  - `components/schedule/LastWeekAgenda.tsx`

### Contrats HTTP prÃ©servÃ©s

- Endpoint `/api/me/services` inchangÃ©.
- RequÃªte `GET` inchangÃ©e.
- Shape du catalogue et du `joinCode` inchangÃ©e.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `LastWeekAgenda.tsx` reste volumineux; ce sous-lot ne traite que la synthÃ¨se services.
- Validation manuelle Ã  refaire sur l'affichage du code d'association et la copie clipboard.

### VÃ©rifications manuelles Ã  refaire

- `LastWeekAgenda` :
  - affichage du compteur de services pour un instructeur
  - apparition de la modale si aucun service
  - affichage/copie du `joinCode` quand des services existent

## 2026-04-19 - Lot FE-3 bis (availability time primitives partagees)

### PÃƒÂ©rimÃƒÂ¨tre

- Extraction des primitives horaires partagÃƒÂ©es pour `availability-agenda` et `associate-agency-availability`.
- Mutualisation du sÃƒÂ©lecteur horaire localisÃƒÂ©, des conversions horaire/minutes et des helpers de rendu des blocs d'agenda.
- Aucun changement de contrat HTTP; uniquement du refactor front ciblÃƒÂ©.

### Fichiers crÃƒÂ©ÃƒÂ©s

- `lib/client/utils/availability-time.ts`
- `components/availability/TimeSelect5mLocale.tsx`

### Fichiers modifiÃƒÂ©s

- `components/associate-agency-availability.tsx`
- `components/availability-agenda.tsx`
- `app/[locale]/(routes)/(routes)/(pay)/(educator)/gestion/page.tsx`

### Appels API dÃƒÂ©placÃƒÂ©s dans les clients

- Aucun nouvel endpoint.
- Les appels existants restent dans :
  - `lib/client/api/availabilities-client.ts`
  - `lib/client/api/me-client.ts`
  - `lib/client/api/profile-client.ts`

### Hooks crÃƒÂ©ÃƒÂ©s

- Aucun nouveau hook dans ce sous-lot.

### VÃƒÂ©rification de cartographie API

- Le fichier attendu `dependency-api-contracts.json` n'ÃƒÂ©tant pas prÃƒÂ©sent dans le repo, la cartographie a ÃƒÂ©tÃƒÂ© vÃƒÂ©rifiÃƒÂ©e via `doc/dependency-cruiser/dependency-api-summary.json`.
- Routes confirmÃƒÂ©es pour ce sous-lot :
  - `/api/availabilities`
  - `/api/availabilities/bulk`
  - `/api/me/role`
  - `/api/me/hours`
  - `/api/onboarding/trainer`
- Callers front couverts :
  - `components/associate-agency-availability.tsx`
  - `components/availability-agenda.tsx`

### Contrats HTTP prÃƒÂ©servÃƒÂ©s

- Endpoints inchangÃƒÂ©s.
- MÃƒÂ©thodes HTTP inchangÃƒÂ©es.
- Payloads inchangÃƒÂ©s pour l'onboarding trainer et les disponibilitÃƒÂ©s hebdomadaires.

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`

## Lot abonnement 6

### Fichiers modifiÃƒÂ©s

- `app/api/stripe/checkout/route.ts`
- `components/billing/BillingSubscriptionSection.tsx`

### Changements rÃƒÂ©alisÃƒÂ©s

- RÃƒÂ©alignement de la route `/api/stripe/checkout` avec les formulaires existants :
  - prise en charge explicite de `priceLookupKey`
  - conservation du support `planSlug`
- Correction du CTA d'upgrade Magic dans la facturation pour envoyer la bonne lookup key selon la langue (`EUR` / `USD`).
- Suppression d'un risque de mauvais plan/de mauvaise devise lors de certains parcours d'abonnement aprÃƒÂ¨s l'unification Stripe.

### Contrats HTTP

- Aucun contrat HTTP modifiÃƒÂ©.

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`
- RÃƒÂ©sultat final : OK

## Lot abonnement 7

### Fichiers modifiÃƒÂ©s

- `app/api/stripe/subscription/cancel/route.ts`
- `app/api/stripe/subscription/resume/route.ts`
- `app/api/stripe/portal/route.ts`
- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`
- `messages/en/billing.json`
- `messages/fr/billing.json`

### Changements rÃƒÂ©alisÃƒÂ©s

- Uniformisation des retours d'erreur Stripe facturation en redirections avec `?error=...` pour les actions portail / reprise / cloture.
- Ajout d'un feedback visible sur la page facturation pour :
  - succes checkout
  - cloture programmee
  - customer Stripe manquant
  - abonnement interdit / introuvable
  - echec portail ou reprise/cloture
- Amelioration de l'observabilite utilisateur sans modifier les contrats HTTP existants.

### Contrats HTTP

- Aucun contrat HTTP modifie.

### Verification TypeScript

- Commande executee : `cmd /c npx tsc --noEmit`

## Lot abonnement 8

### Fichiers modifiés

- `app/api/stripe/portal/route.ts`
- `app/api/me/subscription/route.ts`
- `messages/fr/billing.json`

### Changements réalisés

- Suppression de la branche d'erreur dupliquée dans le portail Stripe pour garder un seul chemin de retour cohérent vers la page facturation.
- La route `/api/me/subscription` tente désormais aussi de résoudre un `stripe_customer_id` manquant via la résolution centralisée avant la réconciliation Stripe live.
- Restauration des accents dans la traduction française de la facturation.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`

## Lot billing UX

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`
- `components/billing/BillingSubscriptionSection.tsx`
- `components/billing/BillingInvoicesSection.tsx`
- `components/billing/billing-shared.tsx`
- `messages/en/billing.json`
- `messages/fr/billing.json`

### Changements réalisés

- Refonte de la hiérarchie de la page billing avec :
  - une vraie vue d'ensemble en tête
  - des cartes de synthèse rapides
  - une carte abonnement plus lisible et plus actionnable
  - une zone factures plus claire sur mobile et desktop
- Clarification du wording pour rendre la page plus utile et moins "technique Stripe".
- Harmonisation visuelle des cartes, panneaux secondaires et CTA.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`

## Lot billing toast

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`
- `components/billing/BillingFeedbackToast.tsx`

### Changements réalisés

- Suppression des bannières de feedback sur la page billing.
- Remplacement par un vrai toast client cohérent avec le reste de l'application.
- Conservation des mêmes messages de succès, d'avertissement et d'erreur via les query params existants.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`

## Lot billing trial alignment

### Fichiers modifiés

- `lib/server/billing-trial.ts`
- `app/api/stripe/checkout/route.ts`
- `app/api/stripe/create-checkout-session/route.ts`
- `lib/server/services/billing-page-stripe.ts`

### Changements réalisés

- Si un éducateur s'abonne pendant sa période d'essai, le checkout Stripe reprend désormais le nombre de jours d'essai restants pour faire démarrer le prélèvement à la fin de l'essai.
- La page billing n'affiche plus "période d'essai" si Stripe considère déjà l'abonnement comme actif.
- Alignement entre la logique d'essai interne et le vrai statut Stripe.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`

## Lot abonnement 5

### Fichiers modifiÃƒÂ©s

- `lib/server/stripe-subscription-state.ts`
- `src/lib/require-subscription-if-educator.ts`

### Changements rÃƒÂ©alisÃƒÂ©s

- Ajout d'une synchronisation groupÃƒÂ©e des ÃƒÂ©tats d'abonnement Stripe pour plusieurs utilisateurs.
- Durcissement du contrÃƒÂ´le d'accÃƒÂ¨s cÃƒÂ´tÃƒÂ© clients/agence :
  - lecture locale rapide des abonnements instructeurs
  - puis rÃƒÂ©conciliation Stripe live des ÃƒÂ©ducateurs de l'agence avant d'autoriser ou refuser l'accÃƒÂ¨s
- RÃƒÂ©duction des faux positifs et faux nÃƒÂ©gatifs quand la BDD est en retard par rapport ÃƒÂ  Stripe.

### Contrats HTTP

- Aucun contrat HTTP modifiÃƒÂ©.

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`
- Correction additionnelle faite pour garder la compilation verte :
  - adaptation de `app/[locale]/(routes)/(routes)/(pay)/(educator)/gestion/page.tsx` au typage `params: Promise<...>` gÃƒÂ©nÃƒÂ©rÃƒÂ© par Next.

### Risques restants

- Les deux composants availability restent volumineux malgrÃƒÂ© l'extraction des primitives; un prochain sous-lot peut encore sortir la grille hebdomadaire ou le dialogue de plages.
- Validation manuelle ÃƒÂ  refaire sur les sÃƒÂ©lecteurs horaires FR/EN et la suppression de blocs dans les deux ÃƒÂ©crans.

### VÃƒÂ©rifications manuelles ÃƒÂ  refaire

- `associate-agency-availability` :
  - ajout de plages multiples
  - fusion des plages qui se chevauchent
  - sauvegarde onboarding et hors onboarding
- `availability-agenda` :
  - passage lecture/ÃƒÂ©dition
  - ajout de plage
  - suppression d'un bloc existant
  - affichage des heures restantes pour un profil student

## 2026-04-19 - Lot FE-3 ter (DailyOverridesCard time selector partage)

### PÃƒÂ©rimÃƒÂ¨tre

- Rebranchement de `DailyOverridesCard` sur les primitives availability extraites au lot prÃƒÂ©cÃƒÂ©dent.
- Suppression de la duplication du sÃƒÂ©lecteur horaire localisÃƒÂ© et des helpers minutes/heures dans cette carte.

### Fichiers crÃƒÂ©ÃƒÂ©s

- Aucun.

### Fichiers modifiÃƒÂ©s

- `components/availability/DailyOverridesCard.tsx`

### Appels API dÃƒÂ©placÃƒÂ©s dans les clients

- Aucun nouvel endpoint.
- Les appels du domaine restent portÃƒÂ©s par `useDayOverrides` et `lib/client/api/availabilities-client.ts`.

### Hooks crÃƒÂ©ÃƒÂ©s

- Aucun nouveau hook dans ce sous-lot.

### VÃƒÂ©rification de cartographie API

- Cartographie relue via `doc/dependency-cruiser/dependency-api-summary.json`.
- Routes confirmÃƒÂ©es :
  - `/api/availabilities/day`
- Caller front couvert :
  - `components/availability/DailyOverridesCard.tsx`

### Contrats HTTP prÃƒÂ©servÃƒÂ©s

- Endpoint `/api/availabilities/day` inchangÃƒÂ©.
- MÃƒÂ©thodes HTTP inchangÃƒÂ©es pour chargement/crÃƒÂ©ation/suppression des overrides journaliers.
- Shape des payloads `date/startTime/endTime/kind` inchangÃƒÂ©e.

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`
- RÃƒÂ©sultat final : OK

### Risques restants

- Validation manuelle ÃƒÂ  refaire sur le basculement FR/EN des heures et sur les bornes de fin aprÃƒÂ¨s changement de dÃƒÂ©but.

### VÃƒÂ©rifications manuelles ÃƒÂ  refaire

- `DailyOverridesCard` :
  - ajout d'une indisponibilitÃƒÂ© ponctuelle
  - ajout d'une disponibilitÃƒÂ© ponctuelle
  - suppression d'un override ÃƒÂ  venir
  - cohÃƒÂ©rence du recalage automatique de l'heure de fin

## 2026-04-19 - Lot FE-6 ter (CalculatedAgendaSection sur useAgencyUsers)

### PÃƒÂ©rimÃƒÂ¨tre

- Suppression du chargement inline des users dans `CalculatedAgendaSection`.
- Rebranchement sur le hook existant `useAgencyUsers` pour aligner cette section avec la couche client/hook dÃƒÂ©jÃƒÂ  mise en place sur le domaine `users`.

### Fichiers crÃƒÂ©ÃƒÂ©s

- Aucun.

### Fichiers modifiÃƒÂ©s

- `components/schedule/CalculatedAgendaSection.tsx`

### Appels API dÃƒÂ©placÃƒÂ©s dans les clients

- Aucun nouvel endpoint.
- Le chargement `GET /api/users` ne passe plus directement par le composant et s'appuie dÃƒÂ©sormais sur `useAgencyUsers`.

### Hooks crÃƒÂ©ÃƒÂ©s

- Aucun nouveau hook dans ce sous-lot.

### VÃƒÂ©rification de cartographie API

- Cartographie relue via `doc/dependency-cruiser/dependency-api-summary.json`.
- Route confirmÃƒÂ©e :
  - `/api/users`
- Caller front couvert :
  - `components/schedule/CalculatedAgendaSection.tsx`

### Contrats HTTP prÃƒÂ©servÃƒÂ©s

- Endpoint `/api/users` inchangÃƒÂ©.
- Query/header org inchangÃƒÂ©s.
- Aucune modification des payloads de suppression ou de validation.

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`
- RÃƒÂ©sultat final : OK

### Risques restants

- `CalculatedAgendaSection.tsx` reste volumineux et contient encore beaucoup de logique de rendu, de suppression et de validation.
- Validation manuelle ÃƒÂ  refaire sur la sÃƒÂ©lection par dÃƒÂ©faut d'un membre aprÃƒÂ¨s chargement et aprÃƒÂ¨s suppression d'un ÃƒÂ©lÃƒÂ¨ve.

### VÃƒÂ©rifications manuelles ÃƒÂ  refaire

- `CalculatedAgendaSection` :
  - chargement initial de la liste membres
  - sÃƒÂ©lection automatique du premier membre
  - suppression d'un ÃƒÂ©lÃƒÂ¨ve depuis la lÃƒÂ©gende
  - cohÃƒÂ©rence de la sÃƒÂ©lection aprÃƒÂ¨s suppression

## 2026-04-19 - Lot FE-3 quater (WeeklyGlobalAgenda data hook)

### PÃƒÂ©rimÃƒÂ¨tre

- Extraction du chargement hebdomadaire de `WeeklyGlobalAgenda` vers un hook dÃƒÂ©diÃƒÂ©.
- Conservation du rendu existant pour les disponibilitÃƒÂ©s par dÃƒÂ©faut, overrides journaliers, slots et trajets.

### Fichiers crÃƒÂ©ÃƒÂ©s

- `lib/client/hooks/useWeeklyGlobalAgendaData.ts`

### Fichiers modifiÃƒÂ©s

- `components/availability/WeeklyGlobalAgenda.tsx`

### Appels API dÃƒÂ©placÃƒÂ©s dans les clients

- Aucun nouvel endpoint.
- Les lectures semaine/slots/trajets restent centralisÃƒÂ©es dans `lib/client/api/availabilities-client.ts`.
- Les appels suivants ne sont plus gÃƒÂ©rÃƒÂ©s directement dans le composant :
  - `GET /api/availabilities/day`
  - `GET /api/slots/week`
  - `GET /api/travels/week`

### Hooks crÃƒÂ©ÃƒÂ©s

- `useWeeklyGlobalAgendaData`

### VÃƒÂ©rification de cartographie API

- Cartographie relue via `doc/dependency-cruiser/dependency-api-summary.json`.
- Routes confirmÃƒÂ©es :
  - `/api/availabilities/day`
  - `/api/slots/week`
  - `/api/travels/week`
- Caller front couvert :
  - `components/availability/WeeklyGlobalAgenda.tsx`

### Contrats HTTP prÃƒÂ©servÃƒÂ©s

- Endpoints inchangÃƒÂ©s.
- MÃƒÂ©thodes HTTP inchangÃƒÂ©es.
- MÃƒÂªmes filtres mÃƒÂ©tier conservÃƒÂ©s :
  - slots visibles limitÃƒÂ©s au `clientUserId` ou `dogsitterUserId`
  - trajets masquÃƒÂ©s pour le rÃƒÂ´le `student`

### VÃƒÂ©rification TypeScript

- Commande exÃƒÂ©cutÃƒÂ©e : `cmd /c npx tsc --noEmit`
- RÃƒÂ©sultat final : OK

### Risques restants

- `WeeklyGlobalAgenda.tsx` reste encore volumineux cÃƒÂ´tÃƒÂ© rendu.
- Une future extraction peut encore sortir les blocs `travel` et `slot` en sous-composants de prÃƒÂ©sentation.

### VÃƒÂ©rifications manuelles ÃƒÂ  refaire

- `WeeklyGlobalAgenda` :
  - navigation semaine prÃƒÂ©cÃƒÂ©dente/suivante
  - affichage des overrides journaliers
  - affichage des slots rÃƒÂ©servÃƒÂ©s
  - ouverture Google Maps depuis un trajet
  - masquage des trajets pour un `student`

## 2026-04-19 - Lot FE-4 bis (OptimalSchedule sur useAgencyUsers)

### PÃƒÆ’Ã‚Â©rimÃƒÆ’Ã‚Â¨tre

- Suppression du chargement inline des ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ves dans `OptimalSchedule`.
- Rebranchement sur `useAgencyUsers` pour rÃƒÆ’Ã‚Â©utiliser la couche `users` dÃƒÆ’Ã‚Â©jÃƒÆ’Ã‚Â  centralisÃƒÆ’Ã‚Â©e.

### Fichiers crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©s

- Aucun.

### Fichiers modifiÃƒÆ’Ã‚Â©s

- `components/optimal-schedule.tsx`

### Appels API dÃƒÆ’Ã‚Â©placÃƒÆ’Ã‚Â©s dans les clients

- Aucun nouvel endpoint.
- La lecture `GET /api/users?role=student` n'est plus gÃƒÆ’Ã‚Â©rÃƒÆ’Ã‚Â©e directement dans le composant.

### Hooks crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©s

- Aucun nouveau hook dans ce sous-lot.

### VÃƒÆ’Ã‚Â©rification de cartographie API

- Cartographie relue via `doc/dependency-cruiser/dependency-api-summary.json`.
- Route confirmÃƒÆ’Ã‚Â©e :
  - `/api/users`
- Caller front couvert :
  - `components/optimal-schedule.tsx`

### Contrats HTTP prÃƒÆ’Ã‚Â©servÃƒÆ’Ã‚Â©s

- Endpoint `/api/users` inchangÃƒÆ’Ã‚Â©.
- Filtre `role=student` conservÃƒÆ’Ã‚Â©.
- Header `x-org-id` conservÃƒÆ’Ã‚Â© via le client/hook existant.

### VÃƒÆ’Ã‚Â©rification TypeScript

- Commande exÃƒÆ’Ã‚Â©cutÃƒÆ’Ã‚Â©e : `cmd /c npx tsc --noEmit`
- RÃƒÆ’Ã‚Â©sultat final : OK

### Risques restants

- `OptimalSchedule` reste trÃƒÆ’Ã‚Â¨s textuel et pourrait encore ÃƒÆ’Ã‚Âªtre alignÃƒÆ’Ã‚Â© sur les traductions plus tard.
- Validation manuelle ÃƒÆ’Ã‚Â  refaire sur l'affichage de l'erreur de chargement des ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ves et sur l'alimentation de `StudentsAvailabilityHeatmap`.

### VÃƒÆ’Ã‚Â©rifications manuelles ÃƒÆ’Ã‚Â  refaire

- `OptimalSchedule` :
  - chargement de la liste des ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ves
  - gÃƒÆ’Ã‚Â©nÃƒÆ’Ã‚Â©ration d'un planning
  - affichage de la heatmap avec la liste issue du hook

## 2026-04-19 - Lot FE-4 ter (StudentsAvailabilityHeatmap sur useAllAvailabilities)

### PÃƒÆ’Ã‚Â©rimÃƒÆ’Ã‚Â¨tre

- Extraction de la lecture globale des disponibilitÃƒÆ’Ã‚Â©s dans un hook dÃƒÆ’Ã‚Â©diÃƒÆ’Ã‚Â©.
- Rebranchement de `StudentsAvailabilityHeatmap` sur ce hook pour supprimer la gestion inline `loading/error/fetch`.

### Fichiers crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©s

- `lib/client/hooks/useAllAvailabilities.ts`

### Fichiers modifiÃƒÆ’Ã‚Â©s

- `components/gestion/StudentsAvailabilityHeatmap.tsx`

### Appels API dÃƒÆ’Ã‚Â©placÃƒÆ’Ã‚Â©s dans les clients

- Aucun nouvel endpoint.
- La lecture `GET /api/availabilities/all` n'est plus gÃƒÆ’Ã‚Â©rÃƒÆ’Ã‚Â©e directement dans le composant.

### Hooks crÃƒÆ’Ã‚Â©ÃƒÆ’Ã‚Â©s

- `useAllAvailabilities`

### VÃƒÆ’Ã‚Â©rification de cartographie API

- Cartographie relue via `doc/dependency-cruiser/dependency-api-summary.json`.
- Route confirmÃƒÆ’Ã‚Â©e :
  - `/api/availabilities/all`
- Caller front couvert :
  - `components/gestion/StudentsAvailabilityHeatmap.tsx`

### Contrats HTTP prÃƒÆ’Ã‚Â©servÃƒÆ’Ã‚Â©s

- Endpoint `/api/availabilities/all` inchangÃƒÆ’Ã‚Â©.
- Shape de rÃƒÆ’Ã‚Â©ponse toujours supportÃƒÆ’Ã‚Â©e en tableau direct ou objet `{ availabilities | data }`.

### VÃƒÆ’Ã‚Â©rification TypeScript

- Commande exÃƒÆ’Ã‚Â©cutÃƒÆ’Ã‚Â©e : `cmd /c npx tsc --noEmit`
- RÃƒÆ’Ã‚Â©sultat final : OK

### Risques restants

- La heatmap reste trÃƒÆ’Ã‚Â¨s orientÃƒÆ’Ã‚Â©e prÃƒÆ’Ã‚Â©sentation et texte en dur; une future passe pourra traiter la traduction/UI.
- Validation manuelle ÃƒÆ’Ã‚Â  refaire sur le message des ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ves sans disponibilitÃƒÆ’Ã‚Â©s.

### VÃƒÆ’Ã‚Â©rifications manuelles ÃƒÆ’Ã‚Â  refaire

- `StudentsAvailabilityHeatmap` :
  - chargement des disponibilitÃƒÆ’Ã‚Â©s globales
  - affichage de la lÃƒÆ’Ã‚Â©gende
  - affichage des ÃƒÆ’Ã‚Â©lÃƒÆ’Ã‚Â¨ves sans disponibilitÃƒÆ’Ã‚Â©s
  - cohÃƒÆ’Ã‚Â©rence des intensitÃƒÆ’Ã‚Â©s sur la grille
## 2026-04-19 - Lot FE-6 quater (schedule display shared + split LastWeekAgenda)

### PÃ©rimÃ¨tre

- Mutualisation des helpers de rendu du domaine `schedule`.
- Extraction de `LastWeekAgenda` en sous-composants d'en-tÃªte et de grille.
- Rebranchement de `CalculatedAgendaSection` sur les helpers partagÃ©s de timeline/couleurs.

### Fichiers crÃ©Ã©s

- `lib/client/utils/schedule-display.ts`
- `components/schedule/last-week-agenda-shared.ts`
- `components/schedule/LastWeekAgendaHeader.tsx`
- `components/schedule/LastWeekAgendaGrid.tsx`

### Fichiers modifiÃ©s

- `components/schedule/LastWeekAgenda.tsx`
- `components/schedule/CalculatedAgendaSection.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les lectures `GET /api/me/weeks` et `GET /api/me/services` restent portÃ©es par :
  - `lib/client/hooks/useMyWeeks.ts`
  - `lib/client/hooks/useOwnServiceSummary.ts`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Les composants `schedule` restent branchÃ©s sur les hooks dÃ©jÃ  refactorisÃ©s, sans retour Ã  des `fetch` inline.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- ParamÃ¨tres `userId` / `weekStart` inchangÃ©s.
- Aucun payload modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `CalculatedAgendaSection.tsx` reste encore assez volumineux et peut encore Ãªtre divisÃ© en lÃ©gende + grille.
- Validation manuelle Ã  refaire sur la copie du code d'association, l'ouverture Google Maps des trajets et la vue Ã©lÃ¨ve des prochains cours.

### VÃ©rifications manuelles Ã  refaire

- `LastWeekAgenda` :
  - affichage/copie du `joinCode`
  - ouverture de Google Maps depuis un trajet
  - navigation semaine prÃ©cÃ©dente/suivante
  - vue `student` avec prochains cours
- `CalculatedAgendaSection` :
  - cohÃ©rence des couleurs partenaires aprÃ¨s mutualisation
## 2026-04-19 - Lot FE-6 quinquies (split CalculatedAgendaSection)

### PÃ©rimÃ¨tre

- Extraction des types/constantes partagÃ©s du calcul d'agenda.
- SÃ©paration de la lÃ©gende partenaires et de la grille horaire hors de `CalculatedAgendaSection`.
- Conservation du flux existant de sÃ©lection membre, suppression Ã©lÃ¨ve et validation moniteurs.

### Fichiers crÃ©Ã©s

- `components/schedule/calculated-agenda-shared.ts`
- `components/schedule/CalculatedAgendaPartnersLegend.tsx`
- `components/schedule/CalculatedAgendaGrid.tsx`

### Fichiers modifiÃ©s

- `components/schedule/CalculatedAgendaSection.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les accÃ¨s `GET /api/users`, `DELETE /api/users/:id` et `POST /api/schedule/commit` restent centralisÃ©s dans :
  - `useAgencyUsers`
  - `users-client`
  - `useCommitSchedule`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le composant reste branchÃ© sur la couche client/hook dÃ©jÃ  en place.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payload de suppression user inchangÃ©.
- Payload `matches/scope` de validation planning inchangÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Validation manuelle encore nÃ©cessaire sur la suppression d'un Ã©lÃ¨ve depuis la lÃ©gende et sur la sÃ©lection automatique aprÃ¨s suppression.
- Les textes restent en dur dans cette zone; une future passe pourrait viser la traduction, mais ce n'Ã©tait pas l'objet du plan structurel.

### VÃ©rifications manuelles Ã  refaire

- `CalculatedAgendaSection` :
  - sÃ©lection d'un membre
  - suppression d'un Ã©lÃ¨ve depuis la lÃ©gende
  - recalage de la sÃ©lection aprÃ¨s suppression
  - validation de tous les moniteurs
## 2026-04-19 - Lot FE-3 quinquies (split WeeklyGlobalAgenda)

### PÃ©rimÃ¨tre

- Extraction de la grille de rendu de `WeeklyGlobalAgenda`.
- Mutualisation des helpers restants de prix et d'ouverture Google Maps.
- Conservation du hook `useWeeklyGlobalAgendaData` et des mÃªmes rÃ¨gles d'affichage pour disponibilitÃ©s, overrides, trajets et slots.

### Fichiers crÃ©Ã©s

- `components/availability/weekly-global-agenda-shared.ts`
- `components/availability/WeeklyGlobalAgendaGrid.tsx`

### Fichiers modifiÃ©s

- `components/availability/WeeklyGlobalAgenda.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les lectures du domaine restent portÃ©es par :
  - `useWeeklyAvailabilities`
  - `useWeeklyGlobalAgendaData`
  - `lib/client/api/availabilities-client.ts`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Les appels `GET /api/availabilities/day`, `GET /api/slots/week` et `GET /api/travels/week` restent indirectement consommÃ©s via le hook de donnÃ©es existant.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- ParamÃ¨tres `from/to/date` inchangÃ©s.
- Aucune modification des payloads consommÃ©s.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda.tsx` et `associate-agency-availability.tsx` restent encore volumineux, mais leurs appels rÃ©seau et primitives horaires ont dÃ©jÃ  Ã©tÃ© extraits sur les lots prÃ©cÃ©dents.
- Validation manuelle Ã  refaire sur l'ouverture Maps et la superposition visuelle des blocs par jour.

### VÃ©rifications manuelles Ã  refaire

- `WeeklyGlobalAgenda` :
  - affichage des disponibilitÃ©s par dÃ©faut
  - affichage des overrides journaliers
  - ouverture Google Maps depuis un trajet
  - affichage des slots avec service/prix
## 2026-04-19 - Lot FE-3 sexies (availability ranges dialog shared)

### PÃ©rimÃ¨tre

- Extraction du dialogue d'ajout de plages horaires commun Ã  `availability-agenda` et `associate-agency-availability`.
- Mutualisation de l'ajustement automatique de l'heure de fin quand l'heure de dÃ©but change.
- Aucune modification des validations mÃ©tier, ni des mutations API.

### Fichiers crÃ©Ã©s

- `components/availability/AvailabilityRangesDialog.tsx`

### Fichiers modifiÃ©s

- `components/availability-agenda.tsx`
- `components/associate-agency-availability.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les appels existants restent portÃ©s par :
  - `useWeeklyAvailabilities`
  - `getWeeklyAvailabilities`
  - `replaceWeeklyAvailabilities`
  - `completeTrainerOnboarding`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le lot ne touche qu'Ã  la couche de prÃ©sentation/interaction du formulaire horaire.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads de disponibilitÃ©s hebdomadaires inchangÃ©s.
- Payload d'onboarding trainer inchangÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda.tsx` et `associate-agency-availability.tsx` gardent encore une grosse duplication de grille hebdomadaire.
- Validation manuelle Ã  refaire sur le recalage de l'heure de fin aprÃ¨s changement du dÃ©but dans les deux Ã©crans.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - ajout de plusieurs plages dans une mÃªme ouverture de dialogue
  - recalage automatique de l'heure de fin
- `associate-agency-availability` :
  - ajout de plusieurs plages
  - fermeture/rÃ©ouverture du dialogue
## 2026-04-19 - Lot FE-3 septies (availability week grid shared)

### PÃ©rimÃ¨tre

- Extraction du squelette de grille hebdomadaire commun Ã  `availability-agenda` et `associate-agency-availability`.
- Conservation de blocs mÃ©tier spÃ©cifiques dans chaque Ã©cran.
- Aucune modification des chargements, mutations ou validations API.

### Fichiers crÃ©Ã©s

- `components/availability/AvailabilityWeekGrid.tsx`

### Fichiers modifiÃ©s

- `components/availability-agenda.tsx`
- `components/associate-agency-availability.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Le lot est purement structurel sur le rendu hebdomadaire.

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Les composants availability restent branchÃ©s sur leur couche client/hook existante.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads inchangÃ©s.
- Aucun changement sur les routes `/api/availabilities`, `/api/availabilities/bulk` ou `/api/onboarding/trainer`.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Les deux composants gardent encore leur logique mÃ©tier locale, mais la duplication de la structure de grille et du dialogue a Ã©tÃ© significativement rÃ©duite.
- Validation manuelle Ã  refaire sur les clics de cellule et la suppression d'une plage directement dans la grille.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - clic sur cellule en mode Ã©dition
  - suppression d'une plage existante
- `associate-agency-availability` :
  - clic sur cellule pour crÃ©er une plage
  - suppression d'une plage draft
## 2026-04-19 - Lot FE-3 octies (availability editor utils shared)

### PÃ©rimÃ¨tre

- Centralisation des primitives d'Ã©dition hebdomadaire encore dupliquÃ©es.
- Mutualisation de la crÃ©ation de plage initiale au clic, des helpers de draft, et de la validation des plages.
- Rebranchement de `availability-agenda` et `associate-agency-availability` sur ces helpers partagÃ©s.

### Fichiers crÃ©Ã©s

- `lib/client/utils/availability-editor.ts`

### Fichiers modifiÃ©s

- `components/availability-agenda.tsx`
- `components/associate-agency-availability.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les appels existants restent inchangÃ©s et portÃ©s par la couche client dÃ©jÃ  en place.

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le lot touche uniquement aux helpers de logique front locale.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads de disponibilitÃ©s et d'onboarding inchangÃ©s.
- Aucune modification des shapes envoyÃ©es aux routes existantes.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda.tsx` reste le composant availability le plus dense, surtout cÃ´tÃ© chargement du rÃ´le, heures utilisateur et notices d'Ã©dition.
- Validation manuelle Ã  refaire sur les messages d'erreur de bornes et de pas de 5 minutes dans les deux Ã©crans.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - erreur ordre/plage/pas dans le dialogue
  - ouverture d'une plage par clic sur cellule
- `associate-agency-availability` :
  - erreur ordre/plage/pas dans le dialogue
  - sauvegarde aprÃ¨s modifications draft
## 2026-04-19 - Lot FE-3 nonies (associate draft hook + availability current user hook)

### PÃ©rimÃ¨tre

- Extraction de la gestion `saved/draft/loading/saving/saveAll/reset` de `associate-agency-availability` dans un hook dÃ©diÃ©.
- Extraction de la rÃ©cupÃ©ration utilisateur courant/rÃ´le/heures de `availability-agenda` dans un hook dÃ©diÃ©.
- Suppression de la fausse liste mono-utilisateur locale dans `availability-agenda`.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useEditableWeeklyAvailabilityDraft.ts`
- `lib/client/hooks/useAvailabilityCurrentUser.ts`

### Fichiers modifiÃ©s

- `components/associate-agency-availability.tsx`
- `components/availability-agenda.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les lectures/mutations existantes restent inchangÃ©es et passent toujours par :
  - `getWeeklyAvailabilities`
  - `replaceWeeklyAvailabilities`
  - `completeTrainerOnboarding`
  - `getMyRole`
  - `getMyHours`

### Hooks crÃ©Ã©s

- `useEditableWeeklyAvailabilityDraft`
- `useAvailabilityCurrentUser`

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le lot dÃ©place de la logique locale dans des hooks sans modifier les contrats ni les clients.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads des disponibilitÃ©s hebdomadaires inchangÃ©s.
- Payload d'onboarding trainer inchangÃ©.
- Lecture de `/api/me/role` et `/api/me/hours` inchangÃ©e.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda.tsx` reste encore le composant availability le plus dense, surtout cÃ´tÃ© notices d'UI, rendu des blocs et gestion du mode Ã©dition.
- Validation manuelle Ã  refaire sur l'affichage des heures restantes/plannifiÃ©es et sur le fallback quand `getMyRole` Ã©choue.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - affichage du nom/rÃ´le courant
  - affichage des heures restantes/plannifiÃ©es pour un `student`
  - comportement si `/api/me/role` ou `/api/me/hours` rÃ©pond en erreur
- `associate-agency-availability` :
  - reset du draft
  - sauvegarde onboarding et hors onboarding
## 2026-04-19 - Lot FE-3 decies (split AvailabilityAgenda presentation)

### PÃ©rimÃ¨tre

- Extraction de la prÃ©sentation encore monolithique de `availability-agenda`.
- Sortie de l'en-tÃªte/mÃ©ta UI et du rendu d'un bloc de disponibilitÃ© en sous-composants.
- Centralisation des petits helpers de prÃ©sentation availability agenda.

### Fichiers crÃ©Ã©s

- `components/availability/availability-agenda-shared.ts`
- `components/availability/AvailabilityAgendaHeader.tsx`
- `components/availability/AvailabilityAgendaSlotBlock.tsx`

### Fichiers modifiÃ©s

- `components/availability-agenda.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Aucun changement sur les hooks ou clients API consommÃ©s.

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le lot est purement structurel cÃ´tÃ© prÃ©sentation.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads inchangÃ©s.
- Aucun impact sur `/api/availabilities`, `/api/me/role` ou `/api/me/hours`.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda.tsx` est maintenant nettement plus lisible, mais la gestion de notice/temps relatif reste encore locale au composant.
- Validation manuelle Ã  refaire sur l'affichage du header, l'indice de derniÃ¨re mise Ã  jour et la suppression d'un bloc en mode Ã©dition.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - affichage du header et du mode Ã©dition
  - affichage des heures pour un `student`
  - suppression d'une plage dans la grille
## 2026-04-19 - Lot FE-3 undecies (split AssociateAgencyAvailability presentation)

### PÃ©rimÃ¨tre

- Extraction de la prÃ©sentation encore monolithique de `associate-agency-availability`.
- Sortie de l'en-tÃªte d'action et du bloc draft d'une disponibilitÃ© en sous-composants.
- Correction associÃ©e pour rendre la page `onboarding/choose-organization` conforme au typage App Router de Next.

### Fichiers crÃ©Ã©s

- `components/availability/associate-agency-availability-shared.ts`
- `components/availability/AssociateAgencyAvailabilityHeader.tsx`
- `components/availability/AssociateAgencyAvailabilitySlotBlock.tsx`

### Fichiers modifiÃ©s

- `components/associate-agency-availability.tsx`
- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les hooks et clients utilisÃ©s restent inchangÃ©s.

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Le lot est principalement structurel cÃ´tÃ© prÃ©sentation et compatibilitÃ© Next.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads d'onboarding trainer et de disponibilitÃ©s hebdomadaires inchangÃ©s.
- Aucun changement de navigation ou de contrats HTTP.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `associate-agency-availability.tsx` reste encore coordinateur de son dialogue et de son hook de draft, mais la couche visuelle est nettement plus lisible.
- Validation manuelle Ã  refaire sur le bouton reset/save et sur la suppression d'un bloc draft.

### VÃ©rifications manuelles Ã  refaire

- `associate-agency-availability` :
  - affichage du header et des boutons save/reset
  - suppression d'une plage draft dans la grille
  - sauvegarde onboarding et hors onboarding
## 2026-04-19 - Lot FE-3 duodecies (timed notice + relative time hooks)

### PÃ©rimÃ¨tre

- Extraction de la logique `notice` temporisÃ©e de `availability-agenda`.
- Extraction du rafraÃ®chissement pÃ©riodique et du formatage de temps relatif.
- Rebranchement de `availability-agenda` sur ces hooks utilitaires.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useTimedNotice.ts`
- `lib/client/hooks/useRelativeTimeFormatter.ts`

### Fichiers modifiÃ©s

- `components/availability-agenda.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Aucun changement dans les hooks ou clients API existants.

### Hooks crÃ©Ã©s

- `useTimedNotice`
- `useRelativeTimeFormatter`

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Lot purement structurel sur la logique UI locale.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads inchangÃ©s.
- Aucun impact sur les routes API.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `availability-agenda` reste orchestrateur du dialogue et des mutations, mais la logique d'UI transversale a Ã©tÃ© sortie.
- Validation manuelle Ã  refaire sur la disparition automatique des notices et la mise Ã  jour du "last update".

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - disparition automatique des notices
  - mise Ã  jour du texte de temps relatif
## 2026-04-19 - Lot FE-3 terdecies (availability dialog state hook shared)

### PÃ©rimÃ¨tre

- Mutualisation de l'Ã©tat du dialogue de plages availability.
- DÃ©placement des handlers `openForCell/add/remove/updateStart/updateEnd/reset` dans un hook partagÃ©.
- Centralisation de l'ajustement automatique de l'heure de fin dans les utilitaires d'Ã©dition.

### Fichiers crÃ©Ã©s

- `lib/client/hooks/useAvailabilityRangesDialogState.ts`

### Fichiers modifiÃ©s

- `lib/client/utils/availability-editor.ts`
- `components/availability/AvailabilityRangesDialog.tsx`
- `components/availability-agenda.tsx`
- `components/associate-agency-availability.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Aucun changement sur les appels API existants.

### Hooks crÃ©Ã©s

- `useAvailabilityRangesDialogState`

### VÃ©rification de cartographie API

- Aucun nouveau caller API introduit.
- Lot purement structurel sur l'Ã©tat local availability.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payloads inchangÃ©s.
- Aucun impact sur les routes d'onboarding ou de disponibilitÃ©s.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- Les deux Ã©crans `availability` sont maintenant beaucoup plus courts, mais la validation manuelle reste importante sur les ouvertures/fermetures de dialogue.
- `AvailabilityRangesDialog.tsx` reste le point central de saisie; toute future Ã©volution de ce flux devra Ãªtre revalidÃ©e sur les deux Ã©crans.

### VÃ©rifications manuelles Ã  refaire

- `availability-agenda` :
  - ouverture du dialogue depuis un clic de cellule
  - changement d'heure de dÃ©but/fin
  - fermeture puis rÃ©ouverture du dialogue
- `associate-agency-availability` :
  - mÃªmes vÃ©rifications en mode draft
  - cohÃ©rence du reset des plages aprÃ¨s submit
## 2026-04-19 - Lot FE-5 ter (booking page split presentation)

### PÃ©rimÃ¨tre

- Extraction des helpers de planning et des types locaux encore concentrÃ©s dans `book/page.tsx`.
- Sortie de la grille hebdomadaire de rÃ©servation et de la modale d'alignement dans des composants dÃ©diÃ©s.
- Conservation des hooks `booking` existants et des mÃªmes contrats HTTP.

### Fichiers crÃ©Ã©s

- `components/booking/booking-page-shared.ts`
- `components/booking/BookingAgendaGrid.tsx`
- `components/booking/BookingAlignmentDialog.tsx`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les accÃ¨s restent portÃ©s par :
  - `useBookingServices`
  - `useInstructorWeeklyAgenda`
  - `useBookSlot`
  - `lib/client/api/booking-client.ts`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- `doc/dependency-cruiser/dependency-api-contracts.json` a Ã©tÃ© relu avant le lot.
- Routes confirmÃ©es pour le domaine :
  - `/api/me/instructor-weekly-agenda`
  - `/api/me/instructor-weekly-agenda-proposals`
  - `/api/slots`
- Aucun caller HTTP direct supplÃ©mentaire introduit dans la page.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Query params `weekStart`, `clientLat`, `clientLng`, `clientFormatted`, `isRemote` inchangÃ©s.
- Payload de rÃ©servation inchangÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- `book/proposals/page.tsx` reste plus dense que souhaitÃ© et pourra recevoir une passe similaire.
- Validation manuelle encore nÃ©cessaire sur la grille hebdo, le trait "maintenant" et le dialogue d'alignement.

### VÃ©rifications manuelles Ã  refaire

- `book/page` :
  - navigation semaine prÃ©cÃ©dente/suivante
  - affichage des jours dÃ©sactivÃ©s
  - sÃ©lection d'un crÃ©neau
  - rÃ©servation aprÃ¨s choix d'alignement
## 2026-04-19 - Lot FE-8 bis (billing / invoices split sections)

### PÃ©rimÃ¨tre

- Extraction des gros blocs JSX de `invoices/page.tsx` en composants serveur dÃ©diÃ©s.
- Mutualisation des styles et badges billing dans un fichier partagÃ©.
- Conservation de la logique Stripe/Clerk/SQL et des formulaires HTTP existants.

### Fichiers crÃ©Ã©s

- `components/billing/billing-shared.tsx`
- `components/billing/BillingSubscriptionSection.tsx`
- `components/billing/BillingInvoicesSection.tsx`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun endpoint supplÃ©mentaire dÃ©placÃ©.
- Les formulaires restent branchÃ©s sur :
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/subscription/cancel`
  - `/api/stripe/subscription/resume`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- `doc/dependency-cruiser/dependency-api-contracts.json` a Ã©tÃ© relu avant le lot.
- Callers confirmÃ©s pour `invoices/page.tsx` :
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/subscription/cancel`
  - `/api/stripe/subscription/resume`

### Contrats HTTP prÃ©servÃ©s

- Actions de formulaires inchangÃ©es.
- Champs `formData` inchangÃ©s pour checkout, portal, cancel et resume.
- Aucune modification des routes API Stripe.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- La logique de calcul de l'Ã©tat d'abonnement reste encore concentrÃ©e dans la page et pourra Ãªtre sortie ultÃ©rieurement vers un helper serveur.
- Validation manuelle encore nÃ©cessaire sur les formulaires Stripe et sur le rendu des badges selon les statuts.

### VÃ©rifications manuelles Ã  refaire

- `invoices` :
  - abonnement actif / en essai / clÃ´ture planifiÃ©e
  - portail client Stripe
  - tÃ©lÃ©chargement PDF ou ouverture facture hÃ©bergÃ©e
## 2026-04-19 - Lot FE-7 ter (onboarding split presentation)

### PÃ©rimÃ¨tre

- Extraction de la couche de prÃ©sentation principale de `onboarding/choose-organization/page.tsx`.
- Sortie de l'Ã©cran de blocage, du choix de rÃ´le, de l'en-tÃªte de flow et des formulaires client / Ã©ducateur.
- Conservation de l'orchestration, de l'autocomplete Google et des appels API dans la page.

### Fichiers crÃ©Ã©s

- `components/onboarding/AssociateAgencyBlockingScreen.tsx`
- `components/onboarding/AssociateAgencyModeSelection.tsx`
- `components/onboarding/AssociateAgencyFlowHeader.tsx`
- `components/onboarding/AssociateAgencyClientForm.tsx`
- `components/onboarding/AssociateAgencyTrainerAddressForm.tsx`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les accÃ¨s restent portÃ©s par :
  - `associateToAgency`
  - `getAccountRecordStatus`
  - `completeTrainerOnboarding` via `AssociateAgencyAvailability`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- `doc/dependency-cruiser/dependency-api-contracts.json` a Ã©tÃ© relu avant le lot.
- Routes confirmÃ©es pour le domaine :
  - `/api/agency/association`
  - `/api/me/account_bdd`
  - `/api/onboarding/trainer`
- Aucun contrat API ni appel HTTP direct n'a Ã©tÃ© modifiÃ©.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payload de `associateToAgency` inchangÃ©.
- Payload d'onboarding trainer inchangÃ© via `AssociateAgencyAvailability`.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- La page garde encore l'orchestration du flow multi-Ã©tapes et la logique de validation locale.
- Validation manuelle encore nÃ©cessaire sur l'autocomplete d'adresse et les transitions client -> association / Ã©ducateur -> disponibilitÃ©s.

### VÃ©rifications manuelles Ã  refaire

- `onboarding/choose-organization` :
  - choix du rÃ´le client / Ã©ducateur
  - association client avec code agence
  - passage Ã©tape adresse -> disponibilitÃ©s
  - redirection vers `/myweek` aprÃ¨s onboarding
## 2026-04-19 - Lot FE-7 quater (profile split presentation)

### PÃ©rimÃ¨tre

- Extraction de la prÃ©sentation principale de `profile/page.tsx`.
- Sortie de la carte identitÃ©, de la carte adresse et des deux modales dans des composants dÃ©diÃ©s.
- Simplification associÃ©e du rendu `loading/error` et mutualisation locale du script Google Maps.

### Fichiers crÃ©Ã©s

- `components/profile/profile-shared.ts`
- `components/profile/ProfileIdentityCard.tsx`
- `components/profile/ProfileAddressCard.tsx`
- `components/profile/ProfileNameModal.tsx`
- `components/profile/ProfileAddressModal.tsx`

### Fichiers modifiÃ©s

- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`

### Appels API dÃ©placÃ©s dans les clients

- Aucun nouvel endpoint.
- Les accÃ¨s restent portÃ©s par :
  - `getProfile`
  - `updateProfile`
  - `deleteMyAccount`
  - `useGooglePlacesAutocomplete`

### Hooks crÃ©Ã©s

- Aucun nouveau hook dans ce sous-lot.

### VÃ©rification de cartographie API

- `doc/dependency-cruiser/dependency-api-contracts.json` a Ã©tÃ© relu avant le lot.
- Route confirmÃ©e pour le domaine :
  - `/api/me/profile`
  - `/api/me/delete-account`
- Aucun contrat HTTP ni payload n'a Ã©tÃ© modifiÃ©.

### Contrats HTTP prÃ©servÃ©s

- Endpoints inchangÃ©s.
- Payload `PATCH /api/me/profile` inchangÃ© pour l'Ã©dition du nom et de l'adresse.
- `DELETE /api/me/delete-account` inchangÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK

### Risques restants

- La page garde encore ses Ã©tats d'orchestration locaux; une future passe pourrait sortir cette logique dans un hook de domaine.
- Validation manuelle encore nÃ©cessaire sur l'Ã©dition du nom, l'autocomplete d'adresse, l'aperÃ§u carte et la suppression de compte.

### VÃ©rifications manuelles Ã  refaire

- `profile` :
  - chargement du profil
  - modification du nom
  - modification de l'adresse avec suggestion Google
  - suppression de compte

## 2026-04-19 - Lot FE-5 quater (booking proposals split logic + presentation)

### Périmètre

- Extraction des types, helpers de scoring et formatage de `book/proposals/page.tsx`.
- Sortie du rendu de la grille de propositions dans un composant dédié.
- Simplification de la page pour qu'elle reste centrée sur l'orchestration des hooks et de la mutation de réservation.

### Fichiers créés

- `components/booking/booking-proposals-shared.ts`
- `components/booking/BookingSuggestionsGrid.tsx`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Les accès restent portés par :
  - `useBookingServices`
  - `useInstructorProposalAgenda`
  - `useBookSlot`
  - `lib/client/api/booking-client.ts`

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Aucun nouveau caller HTTP direct introduit.
- Les contrats booking utilisés restent inchangés :
  - `/api/me/instructor-weekly-agenda-proposals`
  - `/api/slots`

### Contrats HTTP préservés

- Endpoints inchangés.
- Query params d'agenda inchangés.
- Payload de réservation inchangé.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Le flux de réservation reste volontairement orchestré dans la page.
- Validation manuelle encore nécessaire sur les libellés de suggestion et la réservation d'un créneau proposé.

### Vérifications manuelles à refaire

- `book/proposals` :
  - calcul des 3 meilleures suggestions
  - réservation d'une proposition
  - retour vers `/myweek`

## 2026-04-19 - Lot FE-6 bis (my weeks route -> service server)

### Périmètre

- Extraction de la logique SQL et des calculs de trajets de `app/api/me/weeks/route.ts`.
- Création d'un service dédié pour la construction du payload `my weeks`.
- Préparation d'une utilité partagée de calcul Distance Matrix pour les services agenda.

### Fichiers créés

- `lib/server/services/agenda-travel.ts`
- `lib/server/services/my-weeks-service.ts`

### Fichiers modifiés

- `app/api/me/weeks/route.ts`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Aucun changement de contrat côté front sur `/api/me/weeks`.

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Endpoint conservé :
  - `/api/me/weeks`
- Query params `userId` et `weekStart` conservés.

### Contrats HTTP préservés

- Shape JSON de réponse conservée.
- Messages d'erreur HTTP existants conservés.
- Aucun changement de méthode ni de query string.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation manuelle encore nécessaire sur les trajets domicile/cours dans l'agenda hebdomadaire.
- Les logs serveur Distance Matrix restent verbeux et pourront être rationalisés ultérieurement.

### Vérifications manuelles à refaire

- `myweek` :
  - chargement semaine courante
  - navigation via `weekStart`
  - affichage des trajets pour un instructeur
  - affichage des 4 prochains cours pour un student

## 2026-04-19 - Lot FE-5 quinquies (instructor agenda service shared server utilities)

### Périmètre

- Rebranchement de `lib/server/services/instructor-agenda-service.ts` sur les utilitaires partagés de ranges temporels et de Distance Matrix.
- Réduction de la duplication serveur entre `instructor-agenda-service` et `my-weeks-service`.
- Conservation stricte des exports, des paramètres d'entrée et du payload de réponse utilisés par les routes booking.

### Fichiers créés

- Aucun nouveau fichier sur ce sous-lot.

### Fichiers modifiés

- `lib/server/services/instructor-agenda-service.ts`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Aucun changement de contrat côté front sur :
  - `/api/me/instructor-weekly-agenda`
  - `/api/me/instructor-weekly-agenda-proposals`

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Endpoints confirmés inchangés :
  - `/api/me/instructor-weekly-agenda`
  - `/api/me/instructor-weekly-agenda-proposals`
- Query params `weekStart`, `clientLat`, `clientLng`, `clientFormatted` conservés.

### Contrats HTTP préservés

- Shape JSON inchangée pour l'agenda instructeur et les propositions.
- Aucune modification des codes d'erreur renvoyés par le service.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Les logs serveurs de debug de créneaux restent présents et pourront être allégés plus tard.
- Validation manuelle encore nécessaire sur les fenêtres client calculées avec adresse override.

### Vérifications manuelles à refaire

- `book/page` :
  - fenêtre client autour des créneaux libres
  - impact des trajets avant/après réservation existante
- `book/proposals` :
  - cohérence des créneaux proposés après override d'adresse

## 2026-04-19 - Lot FE-8 ter (billing page business logic service)

### Périmètre

- Extraction de la logique métier serveur de `invoices/page.tsx` dans un service dédié.
- Sortie des helpers de traduction billing, résolution Stripe customer, lecture DB, sélection abonnement et calcul des états/countdowns.
- Conservation du rendu existant dans la page et des formulaires Stripe inchangés.

### Fichiers créés

- `lib/server/services/billing-page-service.ts`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Les formulaires restent inchangés sur :
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/subscription/cancel`
  - `/api/stripe/subscription/resume`

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Aucun contrat HTTP supplémentaire n'a été introduit.
- La page continue de déléguer l'UI aux composants billing existants.

### Contrats HTTP préservés

- Actions de formulaires inchangées.
- Champs `formData` inchangés.
- Navigation et redirections inchangées.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- La logique Stripe reste dépendante d'états externes difficiles à simuler sans validation manuelle.
- Les libellés FR hérités de l'existant méritent encore une vérification visuelle complète après extraction.

### Vérifications manuelles à refaire

- `invoices` :
  - compte sans customer Stripe
  - abonnement actif / clôture planifiée / abonnement clôturé
  - accès portail Stripe
  - affichage des factures PDF / hosted URL

## 2026-04-19 - Lot FE-cleanup (eslint / hooks / accessibilite restants)

### Périmètre

- Suppression des contournements ESLint restants identifiés dans `app`, `components` et `lib`.
- Correction du bouton de menu mobile pour satisfaire l'accessibilité sans désactiver la règle.
- Rebranchement des effets React restants sur des dépendances explicites.

### Fichiers créés

- Aucun nouveau fichier sur ce lot.

### Fichiers modifiés

- `components/navbar/navbar_mobile.tsx`
- `components/availability/TimeSelect5mLocale.tsx`
- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Aucun changement de contrat HTTP.

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Lot purement structurel / accessibilité / hooks.
- Aucun transport HTTP modifié.

### Contrats HTTP préservés

- Endpoints inchangés.
- Payloads inchangés.
- Navigation inchangée.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Vérifications complémentaires

- Scan exécuté : `rg -n 'eslint-disable|@ts-ignore|@ts-expect-error' app components lib`
- Résultat final : aucune occurrence restante

### Risques restants

- Validation manuelle encore conseillée sur l'ouverture/fermeture du menu mobile et les sélecteurs horaires FR/EN.

### Vérifications manuelles à refaire

- `navbar_mobile` :
  - aria-label du bouton menu ouvert/fermé
  - fermeture du menu après navigation
- `TimeSelect5mLocale` :
  - ajustement auto de la minute quand la combinaison devient invalide
  - rendu FR et EN
- `profile` :
  - rechargement initial du profil
  - bouton retry quand le chargement échoue

## 2026-04-19 - Lot FE-8 quater (billing service split internals)

### Périmètre

- Découpage interne de `billing-page-service.ts` en modules dédiés.
- Séparation des helpers/types, de l'accès DB billing et de la logique Stripe/état d'abonnement.
- Conservation de la même API publique côté page invoices.

### Fichiers créés

- `lib/server/services/billing-page-shared.ts`
- `lib/server/services/billing-page-repository.ts`
- `lib/server/services/billing-page-stripe.ts`

### Fichiers modifiés

- `lib/server/services/billing-page-service.ts`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Aucun changement de contrat HTTP ou de formulaire.

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Aucun impact sur :
  - `/api/stripe/checkout`
  - `/api/stripe/portal`
  - `/api/stripe/subscription/cancel`
  - `/api/stripe/subscription/resume`

### Contrats HTTP préservés

- Page invoices inchangée côté transport.
- Shapes de données retournées au rendu inchangées.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- La logique billing reste métier-dense, mais elle est maintenant mieux segmentée.
- Les validations manuelles Stripe restent nécessaires car les dépendances externes sont inchangées.

### Vérifications manuelles à refaire

- `invoices` :
  - trial sans customer Stripe
  - reprise customer depuis session checkout
  - états active / cancel_at_period_end / canceled

## 2026-04-19 - Lot FE-6 ter (agenda shared date + slot utilities)

### Périmètre

- Mutualisation des helpers de dates agenda et des utilitaires de tri/fusion de créneaux horodatés.
- Rebranchement de `my-weeks-service`, `instructor-agenda-service` et des routes agenda sur ces modules partagés.
- Conservation stricte des contrats HTTP existants.

### Fichiers créés

- `lib/server/services/agenda-date.ts`
- `lib/server/services/agenda-slot-utils.ts`

### Fichiers modifiés

- `lib/server/services/my-weeks-service.ts`
- `lib/server/services/instructor-agenda-service.ts`
- `app/api/me/instructor-weekly-agenda/route.ts`
- `app/api/me/instructor-weekly-agenda-proposals/route.ts`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Aucun changement de transport sur les routes agenda existantes.

### Hooks créés

- Aucun nouveau hook dans ce sous-lot.

### Vérification de cartographie API

- Contrats confirmés inchangés pour :
  - `/api/me/weeks`
  - `/api/me/instructor-weekly-agenda`
  - `/api/me/instructor-weekly-agenda-proposals`

### Contrats HTTP préservés

- Query params `weekStart`, `clientLat`, `clientLng`, `clientFormatted` inchangés.
- Shapes JSON de réponse inchangées.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Les services agenda gardent encore des logs debug serveurs et des blocs métier conséquents.
- Validation manuelle encore nécessaire sur les semaines booking et myweek pour confirmer l'absence de régression temporelle.

### Vérifications manuelles à refaire

- `myweek` :
  - semaine courante / semaine cible
  - fusion des créneaux groupés par étudiant ou instructeur
- `book/page` et `book/proposals` :
  - découpage date de début / date de fin
  - cohérence des fenêtres calculées

## 2026-04-19 - Lot FE-7 quinquies (profile page orchestration hook)

### Périmètre

- Extraction de l'orchestration de `profile/page.tsx` dans un hook dédié.
- Déplacement du chargement profil, des modales, des drafts, des mutations et du flow Google Places dans un state model client réutilisable.
- Conservation du rendu et des contrats HTTP existants.

### Fichiers créés

- `lib/client/hooks/useProfilePageState.ts`

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`

### Appels API déplacés dans les clients

- Aucun nouvel endpoint.
- Les accès restent portés par :
  - `getProfile`
  - `updateProfile`
  - `deleteMyAccount`

### Hooks créés

- `useProfilePageState`

### Vérification de cartographie API

- Aucun changement sur :
  - `/api/me/profile`
  - `/api/me/delete-account`

### Contrats HTTP préservés

- Payloads PATCH profil inchangés.
- Suppression de compte inchangée.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation manuelle encore nécessaire sur les modales nom/adresse et sur le toast de souscription.

### Vérifications manuelles à refaire

- `profile` :
  - chargement initial
  - retry après erreur
  - édition nom
  - édition adresse avec Google Places
  - suppression de compte

## 2026-04-20 - Lot BOOK-UX-2 (smart shortlist et sélection exacte)

### Périmètre

- Amélioration UI/UX du parcours `app/[locale]/(routes)/(routes)/(app)/(client)/book/...`.
- Conservation des appels API existants et des contrats HTTP.
- Ouverture de la sélection à tous les créneaux réellement réservables à l'intérieur d'une plage, sans restriction début/fin de fenêtre.

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`
- `lib/client/hooks/useBookPageState.ts`
- `messages/fr/bookAgenda.json`
- `messages/en/bookAgenda.json`
- `messages/fr/bookProposals.json`
- `messages/en/bookProposals.json`

### Changements réalisés

- Renforcement de la hiérarchie visuelle sur `book/page.tsx` :
  - hero plus contextuel
  - badges de contexte service / durée / lieu
  - rail de progression en 3 étapes
  - carte de contexte de réservation
  - barre CTA sticky mobile quand un créneau précis est sélectionné
- Complétion des microcopies pour le picker d'horaires exacts :
  - nombre d'horaires
  - nombre de suggestions
  - état vide
  - indice de déplacements allégés
- Complétion des microcopies shortlist sur `book/proposals` :
  - mini parcours en 3 temps
  - libellé de date par carte
- Nettoyage des logs de debug restants côté client booking en les basculant sur `devLogger`.

### Contrats HTTP préservés

- Aucun endpoint ajouté.
- Aucun appel API existant modifié.
- Aucune mutation de payload sur les réservations ni sur les agendas.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Risques restants

- Validation manuelle recommandée sur mobile pour confirmer le confort de la barre CTA sticky.
- Validation manuelle recommandée sur les textes FR/EN dans les états sans adresse et sans suggestion.

### Vérifications manuelles à refaire

- `book/proposals` :
  - shortlist de 2 à 4 cartes
  - accès secondaire à "Voir tous les horaires"
  - cohérence des raisons affichées
- `book/page` :
  - sélection d'une plage puis d'un horaire exact intermédiaire
  - nudge sur un horaire non recommandé mais proche d'une meilleure alternative
  - CTA sticky mobile et réservation finale

## 2026-04-20 - Lot BOOK-BUG-1 (stabilisation agenda complet)

### Périmètre

- Correction du chargement infini observé dans le planning complet `book/page`.
- Réduction du clignotement visuel de l'agenda pendant les refetchs.

### Fichiers modifiés

- `lib/client/hooks/useDecodedBookingAddress.ts`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`

### Changements réalisés

- Stabilisation du hook `useDecodedBookingAddress` :
  - le callback `onError` ne participe plus à la clé de mémoïsation
  - l'adresse décodée ne change plus d'identité à chaque rendu si le paramètre URL reste identique
- Suppression du swap agressif "loader ↔ agenda" dans `book/page.tsx` :
  - la grille reste affichée lorsqu'un refetch a déjà des données
  - seul un indicateur de chargement léger reste visible au-dessus de l'agenda

### Hypothèse de cause racine

- Le `bookingAddress` recalculé à chaque rendu pouvait recréer la callback `reload` de `useInstructorWeeklyAgenda`, ce qui relançait l'effet de chargement en boucle.

### Contrats HTTP préservés

- Aucun endpoint modifié.
- Aucun changement de query params ni de payload.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

### Vérifications manuelles à refaire

- `book/page` :
  - ouverture initiale avec adresse en query string
  - absence de spinner infini
  - absence de clignotement pendant l'affichage de la semaine
  - navigation semaine précédente / suivante

## 2026-04-20 - Lot BOOK-UX-3 (allègement des répétitions)

### Périmètre

- Réduction des textes et des éléments redondants sur `book/page` et `book/proposals`.

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `components/booking/BookingSuggestionsGrid.tsx`
- `messages/fr/bookAgenda.json`
- `messages/en/bookAgenda.json`
- `messages/fr/bookProposals.json`
- `messages/en/bookProposals.json`

### Changements réalisés

- Suppression du bloc de progression en 3 cartes dans le hero du planning complet.
- Suppression de la carte de contexte redondante dans la colonne de droite.
- Suppression du texte d'aide sous le CTA de réservation.
- Suppression du bloc "journey" dans la shortlist.
- Suppression du libellé de date répété dans chaque carte de suggestion.
- Suppression du lien de bas de page "Voir tous les horaires" déjà présent dans le hero.
- Raccourcissement de plusieurs microcopies FR/EN pour garder le guidage sans sur-explication.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-UX-4 (retour vers les suggestions)

### Périmètre

- Ajout d'un bouton de retour depuis `book/page` vers `book/proposals`.

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `messages/fr/bookAgenda.json`
- `messages/en/bookAgenda.json`

### Changements réalisés

- Ajout d'un bouton discret "Retour aux suggestions" en haut du planning complet.
- Conservation des query params existants `serviceId` et `addr` pour revenir à la même shortlist.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-BUG-2 (bornes exactes et confirmation shortlist)

### Périmètre

- Correction du décalage artificiel de 5 minutes sur les créneaux extrêmes du planning complet.
- Ajout d'une confirmation légère avant réservation depuis la page des suggestions.

### Fichiers modifiés

- `components/booking/booking-page-shared.ts`
- `components/booking/BookingSuggestionConfirmDialog.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/proposals/page.tsx`
- `messages/fr/bookProposals.json`
- `messages/en/bookProposals.json`

### Changements réalisés

- Suppression du retrait automatique `+5 min / -5 min` appliqué aux fenêtres de disponibilité avant calcul des créneaux exacts.
- Le premier et le dernier créneau réellement disponibles redeviennent sélectionnables.
- Ajout d'une modale de confirmation sur la shortlist avant d'envoyer la réservation effective.

### Cause identifiée

- La normalisation des créneaux appliquait systématiquement :
  - `startTime + 5 min`
  - `endTime - 5 min`
- Cela réduisait chaque fenêtre avant même le calcul des créneaux exacts, d'où l'impossibilité de choisir les bornes.

### Contrats HTTP préservés

- Aucun endpoint modifié.
- Aucun payload modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-UX-5 (affordances shortlist)

### Périmètre

- Clarification visuelle des éléments cliquables sur la page des suggestions.

### Fichiers modifiés

- `components/booking/BookingSuggestionsGrid.tsx`

### Changements réalisés

- Renforcement visuel du bouton "Voir tous les horaires" :
  - fond ambré
  - graisse plus forte
  - icône directionnelle
  - hover plus net
- Renforcement visuel des cartes de suggestions cliquables :
  - fond plus chaud
  - bordure accentuée
  - ombre plus marquée
  - curseur explicite
  - CTA interne plus visible avec icône
- Atténuation des cartes non cliquables de contexte :
  - fond plus neutre
  - contraste plus faible
  - suppression de tout langage visuel ambigu avec les CTA

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-UI-6 (sobriété visuelle)

### Périmètre

- Réduction des dégradés et des aplats jaunes imbriqués sur le parcours booking.

### Fichiers modifiés

- `components/booking/BookingSuggestionsGrid.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`

### Changements réalisés

- Remplacement des grands fonds dégradés par des surfaces neutres `bg-card`.
- Neutralisation des badges décoratifs trop ambrés dans les heroes.
- Conservation de l'accent couleur surtout sur les interactions réellement importantes.
- Simplification visuelle des cartes de suggestions pour éviter l'effet "jaune sur jaune".

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-UX-7 (suppression microcopy secondaire)

### Périmètre

- Suppression du texte secondaire sous les cartes de suggestions.

### Fichiers modifiés

- `components/booking/BookingSuggestionsGrid.tsx`
- `messages/en/bookProposals.json`
- `messages/fr/bookProposals.json`

### Changements réalisés

- Retrait du libellé "Open the full schedule if needed" / "Voir le planning complet si besoin".
- Simplification du pied de carte pour ne garder que le CTA principal.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-UX-8 (compteur de suggestions dans l'agenda)

### Périmètre

- Ajout du nombre de créneaux suggérés directement sur les plages du planning complet.

### Fichiers modifiés

- `lib/client/hooks/useBookPageState.ts`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/page.tsx`
- `components/booking/BookingAgendaGrid.tsx`
- `messages/fr/bookAgenda.json`
- `messages/en/bookAgenda.json`

### Changements réalisés

- Calcul d'un compteur de suggestions recommandé par fenêtre de disponibilité.
- Passage de ce compteur à la grille de l'agenda complet.
- Affichage discret en haut à gauche de chaque plage concernée, sans déplacer le texte existant.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot BOOK-REMINDER-1 (rappel email automatique client)

### Périmètre

- Ajout d'un rappel email automatique pour les séances à venir.
- Conception pensée pour rester compatible avec de futures annulations de créneaux.

### Fichiers modifiés

- `lib/server/repositories/slot-repository.ts`
- `src/emails/bookingClientReminder.tsx`
- `src/lib/inngest/functions/slotReminderClientEmail.ts`
- `app/api/inngest/route.ts`

### Changements réalisés

- Ajout d'une requête serveur pour recharger les détails complets d'un slot à partir de `slotId`.
- Ajout d'un template email dédié au rappel client.
- Ajout d'une fonction Inngest branchée sur l'événement existant `slot/booked-client`.
- Planification automatique du rappel :
  - prioritairement 24h avant
  - sinon 2h avant si la réservation est trop proche
  - sinon aucun rappel si la séance est déjà trop imminente
- Revalidation du slot au moment réel de l'envoi :
  - si le slot n'existe plus, le rappel est ignoré
  - cela prépare le terrain pour une future annulation par suppression ou invalidation du créneau

### Hypothèse retenue pour les annulations futures

- Tant qu'un créneau annulé disparaît de la source de vérité ou devient non chargeable via `slotId`, le rappel ne partira pas.
- Si plus tard l'annulation devient un statut métier sur `Slot`, il faudra simplement filtrer ce statut dans `getSlotReminderDetails`.

### Contrats HTTP préservés

- Aucun endpoint HTTP modifié.
- Aucun contrat de réservation modifié.
- Réutilisation des événements Inngest existants.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot GESTION-EXPORT-1 (export Excel clients)

### Périmètre

- Ajout d'un export Excel localisé depuis la page `gestion` pour les éducateurs et admins.

### Fichiers modifiés

- `lib/server/repositories/org-user-management-repository.ts`
- `lib/server/services/org-user-management-service.ts`
- `app/api/users/export/route.ts`
- `components/gestion/UserManagement.tsx`
- `messages/fr/userManagement.json`
- `messages/en/userManagement.json`

### Changements réalisés

- Ajout d'une requête serveur dédiée pour exporter uniquement les clients de l'agence.
- Enrichissement des lignes exportées avec :
  - email
  - adresse complète
  - rue
  - numéro
  - code postal
  - ville
  - pays
  - minutes prévues
  - minutes restantes
  - dates de création et de mise à jour
- Génération d'un fichier Excel-compatible `.xls` localisé selon la langue.
- Ajout d'un bouton d'export sur la page `gestion`.
- Restriction serveur de l'export aux rôles `instructor` et `admin`.

### Contrats HTTP

- Ajout d'un nouvel endpoint : `GET /api/users/export`
- Aucun contrat existant modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-20 - Lot GESTION-EXPORT-2 (simplification colonnes et toolbar)

### Périmètre

- Retrait des colonnes `planned minutes` et `remaining minutes` de l'export clients.
- Nettoyage des appels d'API d'heures encore branchés précisément dans `gestion`.
- Repositionnement du bouton d'export à droite de la toolbar.

### Fichiers modifiés

- `components/gestion/UserManagement.tsx`
- `lib/server/repositories/org-user-management-repository.ts`
- `app/api/users/export/route.ts`

### Changements réalisés

- Suppression des colonnes d'heures du fichier exporté FR/EN.
- Suppression, dans `UserManagement`, des mutations et helpers d'édition d'heures qui n'étaient plus utilisés visuellement.
- Alignement du bouton d'export à droite de la barre d'outils, séparé du bouton de rafraîchissement.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK
## 2026-04-20 - Lot GESTION-EXPORT-3 (export Excel par client)

### PÃ©rimÃ¨tre

- Ajout d'un export Excel individuel sur chaque ligne client de la page `gestion`.
- Export du total gÃ©nÃ©rÃ© par client et de l'historique complet des cours rÃ©servÃ©s.

### Fichiers modifiÃ©s

- `lib/server/repositories/slot-repository.ts`
- `app/api/users/[id]/export/route.ts`
- `components/gestion/UserManagement.tsx`
- `messages/fr/userManagement.json`
- `messages/en/userManagement.json`

### Changements rÃ©alisÃ©s

- Ajout d'une requÃªte serveur dÃ©diÃ©e pour lister les rÃ©servations d'un client dans l'agence avec :
  - date
  - heure de dÃ©but
  - heure de fin
  - durÃ©e
  - service
  - Ã©ducateur
  - prix
  - adresse
- Ajout d'un nouvel endpoint `GET /api/users/[id]/export` protÃ©gÃ© pour `instructor` et `admin`.
- GÃ©nÃ©ration d'un fichier `.xls` localisÃ© avec :
  - une feuille de synthÃ¨se client
  - le nombre de cours rÃ©servÃ©s
  - le chiffre d'affaires total estimÃ©
  - une feuille listant l'ensemble des cours rÃ©servÃ©s
- Ajout d'une colonne d'action dans `UserManagement` avec un bouton d'export par client, sans modifier les appels existants.

### Contrats HTTP

- Ajout d'un nouvel endpoint : `GET /api/users/[id]/export`
- Aucun contrat existant modifiÃ©.

### VÃ©rification TypeScript

- Commande exÃ©cutÃ©e : `cmd /c npx tsc --noEmit`
- RÃ©sultat final : OK
## 2026-04-26 - Lot SERVICES-TOASTS

### Périmètre

- Retrait des bannières de feedback sur la page `services` éducateur.
- Remplacement par des toasts pour les succès et erreurs de niveau page.

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx`

### Changements réalisés

- Suppression des bannières de succès et d'erreur affichées dans la page.
- Ajout de `sonner` pour afficher les succès de création, modification et suppression en toast.
- Ajout d'un effet pour afficher les erreurs remontées par le hook `useEditableServices` en toast sans les dupliquer à chaque rendu.
- Conservation des erreurs de validation directement dans les modales de formulaire.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-26 - Lot BILLING-TRIAL-COPY

### Périmètre

- Ajout d'une explication explicite sur le déclenchement du premier paiement après la fin de l'essai.

### Fichiers modifiés

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/invoices/page.tsx`
- `components/billing/BillingSubscriptionSection.tsx`
- `messages/fr/billing.json`
- `messages/en/billing.json`

### Changements réalisés

- Ajout d'un microcopy visible avant abonnement dans la page billing.
- Ajout du même rappel à côté des actions d'abonnement quand aucun abonnement n'est encore actif.
- Précision explicite que le premier prélèvement n'a lieu qu'après la fin de l'essai restant.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-DEMO

### Périmètre

- Création d'une page publique autonome pour démontrer la valeur de Magic Hango.
- Démo visuelle avant/après sans aucun appel API.

### Fichiers modifiés

- `app/[locale]/(routes)/magic-hango/page.tsx`
- `components/magic-hango/OptimizationDemo.tsx`
- `messages/fr/magicHango.json`
- `messages/en/magicHango.json`
- `middleware.ts`

### Changements réalisés

- Ajout d'une nouvelle page publique `/{locale}/magic-hango`.
- Construction d'une démo statique avec deux scénarios d'agenda, comparatif avant/après, métriques de trajet et de temps creux.
- Ajout d'une navigation publique cohérente avec bouton d'ouverture de l'app quand l'utilisateur est déjà connecté.
- Déclaration explicite de la route comme publique dans le middleware.

### Contrats HTTP

- Aucun contrat HTTP modifié.
- Aucun appel API ajouté à cette page.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-NAV

### Périmètre

- Ajout d'un accès direct vers la page `magic-hango` dans les navbars.

### Fichiers modifiés

- `app/[locale]/(routes)/home/page.tsx`
- `app/[locale]/(routes)/(routes)/layout.tsx`
- `messages/fr/home.json`
- `messages/en/home.json`

### Changements réalisés

- Ajout d'un bouton `Magic Hango` dans la navbar publique de la home.
- Ajout d'une entrée `Magic Hango` dans la navigation principale de l'application connectée.
- Ajout du libellé correspondant dans les messages FR/EN.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot I18N-MAGIC-HANGO-FIX

### Périmètre

- Correction du chargement des messages `next-intl` pour la page `magic-hango`.

### Fichiers modifiés

- `src/i18n/request.ts`

### Changements réalisés

- Remplacement du chargement legacy via `messages/{locale}.json` par le chargeur unifié `getMessages`.
- Alignement du provider `next-intl` avec les namespaces réellement présents dans `messages/en/*` et `messages/fr/*`.
- Correction de l'erreur `MISSING_MESSAGE` sur `magicHango`.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-MESSAGES

### Périmètre

- Complétion et nettoyage des messages de la page `magic-hango`.

### Fichiers modifiés

- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Ajout des clés manquantes `hero.proof.*` utilisées par la démo.
- Réécriture propre des fichiers FR/EN pour éviter les incohérences de clés.
- Nettoyage du texte FR avec accents corrects sur cette page.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-CLARITY

### Périmètre

- Renforcement de la lisibilité et de la démonstration de valeur de la page `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Ajout d'un résumé explicite par scénario pour expliquer en une lecture ce qui ne va pas avant optimisation.
- Ajout d'une section de gains concrets visibles immédiatement.
- Ajout d'une légende pour rendre l'agenda avant/après plus lisible sans effort.
- Ajout d'un bloc distinct `client / éducateur / business` pour rendre la valeur plus claire selon le point de vue.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-SIMPLIFY

### Périmètre

- Refonte complète de la page `magic-hango` en version plus simple.
- Passage de `magic-hango` comme landing page publique par défaut.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `app/[locale]/(routes)/magic-hango/page.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`
- `middleware.ts`

### Changements réalisés

- Suppression de la version dense avec scénarios multiples, légendes et nombreux blocs.
- Remplacement par une démo unique avant/après beaucoup plus courte et lisible.
- Recentrage de la page sur trois idées : moins de trajet, journée plus compacte, choix client conservé.
- Ajustement du logo de la page pour pointer vers `magic-hango`.
- Changement de la redirection publique par défaut : `/` et `/{locale}` envoient maintenant vers `/{locale}/magic-hango` pour les visiteurs non connectés.

### Contrats HTTP

- Aucun contrat HTTP modifié.
- Aucun appel API ajouté.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-I18N-KEYS

### Périmètre

- Correction de l'affichage brut des clés de traduction dans la démo simplifiée.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Remplacement des clés numériques de type `slots.0.title` par des clés nommées explicites.
- Rebranchement du composant sur ces nouvelles clés.
- Suppression de l'affichage brut `magicHango.simple.before.slots.0.title`.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-GAPS

### Périmètre

- Renforcement de la visibilité des trous entre séances dans la démo `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Ajout d'un type visuel dédié aux trous dans l'agenda.
- Ajout d'un `Idle gap / Grand trou` explicite dans la version avant optimisation.
- Ajout d'une `Short buffer / Petite marge` dans la version optimisée pour rendre la comparaison plus lisible.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-MINI-AGENDA

### Périmètre

- Passage de la démo `magic-hango` en vrai mini agenda visuel.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Remplacement de la simple liste de cartes par deux mini agendas verticaux avec heures et blocs positionnés.
- Affichage explicite des horaires de début et de fin pour chaque créneau.
- Mise en évidence plus nette des trous avec un grand bloc hachuré dans la version non optimisée.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-AGENDA-REBUILD

### Périmètre

- Refonte complète du mini agenda de la page `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Remplacement du rendu fragile par un mini agenda vertical plus propre avec grille horaire stable.
- Positionnement explicite des blocs via `start/end` pour mieux visualiser la durée des créneaux.
- Affichage clair des trous, trajets et créneaux recommandés directement dans la timeline.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-AGENDA-FIX

### Périmètre

- Correction des derniers bugs d'affichage sur le mini agenda `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Augmentation de la hauteur du mini agenda pour laisser respirer les blocs.
- Suppression de la ligne d'horaire redondante qui créait des chevauchements visuels.
- Passage à une hauteur minimale plus généreuse pour chaque bloc.
- Placement de l'heure de fin dans la colonne horaire du bloc pour garder un rendu plus stable.
- Limitation visuelle du texte descriptif pour éviter les débordements.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-TYPES

### Périmètre

- Renforcement de la distinction visuelle entre séances, trajets, marges et créneaux recommandés.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Couleurs plus distinctes entre les types de blocs.
- Ajout d'un badge visible sur chaque bloc pour indiquer explicitement son type.
- Séparation plus nette entre une séance standard et un créneau recommandé.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-BLOCK-DISTINCTION

### Périmètre

- Renforcement final de la distinction entre séances, trajets, marges et recommandations dans le mini agenda.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Palette plus contrastée entre les quatre types de blocs.
- Ajout de badges visibles et explicites directement dans chaque créneau.
- Différenciation plus nette entre une séance classique et un créneau recommandé.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-RETURN-HOME

### Périmètre

- Ajout d'un scénario de long retour à la maison dans la démo `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`
- `messages/en/magicHango.json`
- `messages/fr/magicHango.json`

### Changements réalisés

- Extension de l'agenda jusqu'à 17h pour montrer la fin réelle de journée.
- Ajout d'un `Long trip home / Long retour à la maison` dans la version non optimisée.
- Ajout d'un `Short trip home / Retour plus court` dans la version optimisée pour rendre le contraste plus concret.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-DURATION-SCALE

### Périmètre

- Correction de l'échelle de durée dans le mini agenda `magic-hango`.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Remplacement du positionnement en pourcentage par un positionnement en pixels par minute.
- Calcul de la hauteur des créneaux directement à partir de leur durée réelle.
- Conservation d'une petite hauteur minimale seulement pour éviter qu'un très court trajet devienne illisible.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK

## 2026-04-29 - Lot MAGIC-HANGO-TIMING-ACCURACY

### Périmètre

- Correction de la correspondance exacte entre horaires, position et durée dans le mini agenda.

### Fichiers modifiés

- `components/magic-hango/OptimizationDemo.tsx`

### Changements réalisés

- Passage complet à un modèle en pixels par minute pour la hauteur totale de l'agenda.
- Alignement de la colonne horaire et de la timeline sur la même hauteur réelle.
- Correction de la position et de la hauteur des blocs pour qu'elles correspondent précisément aux horaires affichés.

### Contrats HTTP

- Aucun contrat HTTP modifié.

### Vérification TypeScript

- Commande exécutée : `cmd /c npx tsc --noEmit`
- Résultat final : OK
