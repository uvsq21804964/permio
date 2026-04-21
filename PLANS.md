# PLANS.md — Refactor front-end progressif

Plan de travail front-end pour `app/[locale]` et `components`.

Objectif: refactoriser progressivement le front sans changer le comportement utilisateur attendu, sans casser les routes API déjà stabilisées, et avec un mode d'exécution suffisamment clair pour travailler en autonomie toute la nuit.

Ce document est pensé comme:

- une feuille de route priorisée
- un guide d'exécution par lots
- une checklist de validation continue
- un garde-fou contre les régressions silencieuses

## 1. Principes de travail

### Contraintes globales

- Ne pas changer les endpoints API existants.
- Ne pas changer la shape des payloads attendus par le front tant qu'un lot n'a pas explicitement introduit un adaptateur.
- Éviter toute refonte visuelle inutile si elle n'apporte pas de simplification structurelle.
- Garder les pages fonctionnelles à chaque fin de lot.
- Préférer les extractions ciblées à une réécriture massive.

### Règles de refactor front

- Sortir la logique métier et réseau des pages volumineuses.
- Réduire la duplication des `fetch`, des états `loading/error/saving` et des mappings de payload.
- Introduire des helpers et hooks réutilisables quand une duplication existe dans au moins 2 écrans.
- Conserver les composants UI génériques simples; ne pas sur-ingénierer une architecture design-system si elle n'est pas déjà utilisée.
- Favoriser une organisation par domaine fonctionnel plutôt que par type technique uniquement.

### Règle de taille de changement

- Préférer plusieurs petits commits logiques à une grosse réécriture.
- Ne pas refactoriser plus d’un domaine métier important à la fois.
- Si un lot implique plus de ~8 fichiers fortement modifiés, le sous-découper.

### Règle de nommage

- Ne pas renommer fichiers, hooks, props ou variables publiques sans bénéfice clair.
- Éviter les renommages purement esthétiques pendant un lot de refactor structurel.
- Priorité à la stabilité des imports et à la lisibilité locale.

### Règle sur les hooks

- Un hook doit encapsuler un besoin fonctionnel clair, pas juste déplacer du code.
- Éviter les hooks trop génériques si un hook de domaine est plus lisible.
- Préférer `useInstructorServices` à un hook abstrait difficile à comprendre.

### Zones à ne pas refactoriser sans besoin explicite

- composants UI génériques simples
- fichiers de traduction sauf nécessité directe
- logique Clerk déjà stable si elle n'est pas dupliquée
- intégrations externes sensibles tant qu'elles ne bloquent pas le lot courant

### Règle si validation manuelle impossible

Si une validation manuelle complète n'est pas possible:

- vérifier au minimum les types et imports
- vérifier la cohérence des props et appels API
- laisser une note explicite dans le compte-rendu

### Utilisation obligatoire de `dependency-api-contracts.json`

Le fichier `doc/dependency-cruiser/dependency-api-contracts.json` doit être utilisé comme source de contexte avant tout refactor front impliquant des appels API.

#### Rôle du fichier

Ce fichier sert à :

- identifier quelles pages et quels composants appellent quelles routes API
- repérer les routes partagées entre plusieurs écrans
- détecter les opportunités de mutualisation des clients API et hooks
- éviter d'oublier un appel API identique présent dans un autre écran
- prioriser les refactors selon les zones les plus connectées à l'API

#### Règle d'utilisation

Avant de commencer un lot impliquant des appels API :

1. lire `dependency-api-contracts.json`
2. relever les routes API concernées par le domaine
3. relever tous les callers front associés
4. comparer avec les `fetch` réellement présents dans les fichiers
5. définir la stratégie de mutualisation à partir de cette cartographie

#### Vérification attendue par lot

À la fin de chaque lot impliquant l'API, vérifier :

- que tous les appels API du domaine ont bien été identifiés
- qu'aucun caller front important n'a été oublié
- que les appels déplacés dans les clients API couvrent bien tous les usages du domaine
- que les endpoints et payloads restent inchangés

#### Exemples d'usage attendus

- Pour le lot `services`, utiliser `dependency-api-contracts.json` pour identifier tous les callers de :
  - `/api/me/services`
  - `/api/me/instructor-services`

- Pour le lot `availability`, utiliser `dependency-api-contracts.json` pour identifier tous les callers de :
  - `/api/availabilities`
  - `/api/availabilities/day`
  - `/api/availabilities/all`
  - `/api/availabilities/bulk`

- Pour le lot `booking`, utiliser `dependency-api-contracts.json` pour identifier tous les callers de :
  - `/api/me/instructor-services`
  - `/api/me/instructor-weekly-agenda`
  - `/api/me/instructor-weekly-agenda-proposals`
  - `/api/slots`

### Définition de fini pour un lot

- Le code est plus lisible qu'avant.
- La surface modifiée est limitée et compréhensible.
- Les pages concernées fonctionnent toujours manuellement.
- Les erreurs et états de chargement restent gérés.
- Les dépendances introduites sont minimales.

### Sortie attendue pour chaque lot

À la fin de chaque lot, produire :

- la liste des fichiers créés
- la liste des fichiers modifiés
- les appels API déplacés dans les clients
- les hooks créés
- les risques restants
- les vérifications manuelles à refaire

## 2. Cartographie rapide du front à traiter

### Zones applicatives principales dans `app/[locale]`

- `home`
- `onboarding/choose-organization`
- `profile`
- `services`
- `availability`
- `myweek`
- `book`
  - `book/page.tsx`
  - `book/address/page.tsx`
  - `book/services/page.tsx`
  - `book/proposals/page.tsx`
- `gestion`
- `plans`
- `invoices`

### Composants lourds identifiés

- `components/schedule/LastWeekAgenda.tsx`
- `components/availability-agenda.tsx`
- `components/associate-agency-availability.tsx`
- `components/availability/WeeklyGlobalAgenda.tsx`
- `components/availability/DailyOverridesCard.tsx`
- `components/schedule/CalculatedAgendaSection.tsx`
- `components/gestion/UserManagement.tsx`
- `components/gestion/StudentsAvailabilityHeatmap.tsx`
- `components/optimal-schedule.tsx`

### Indices clairs de dette technique front

- Multiples `fetch('/api/...')` dispersés directement dans les pages et composants.
- Duplication des patterns `loading/error/reload`.
- Composants très longs mélangeant:
  - réseau
  - transformations de données
  - logique métier
  - rendu
- Présence de flows multi-écrans `book` avec états distribués.
- Mélange de pages server et client avec responsabilités parfois floues.
- Traductions parfois absentes ou textes en dur dans certaines pages.

## 3. Architecture cible minimale

Le but n'est pas de refaire toute l'architecture, mais d'introduire une structure simple et stable:

### Dossiers cibles

- `components/<domain>/...`
  - composants de rendu
  - sous-composants d'écran
- `lib/client/api/...`
  - wrappers `fetch` par domaine
- `lib/client/hooks/...`
  - hooks réutilisables pour chargement, mutation, polling léger, etc.
- `lib/client/mappers/...`
  - normalisation de payloads si nécessaire
- `lib/client/utils/...`
  - helpers front purs

### Couches front minimales

- Page:
  - compose l'écran
  - gère les paramètres de route si besoin
- Hook de domaine:
  - charge les données
  - expose `data`, `loading`, `error`, `reload`
  - centralise les mutations simples
- Client API:
  - contient les appels `fetch`
  - centralise parsing, erreurs et conventions
- Composant de présentation:
  - reçoit des props propres
  - évite d'appeler directement l'API si possible

### Standard minimal des clients API

- Toujours centraliser:
  - URL
  - méthode
  - headers JSON
  - parsing des erreurs
- Toujours renvoyer des objets lisibles côté hook.
- Ne jamais dupliquer 5 fois la même gestion `res.ok / await res.text() / throw`.

## 4. Priorités fortes

### Priorité P1

- Base réseau front
- Services
- Availability
- Booking

### Priorité P2

- Users / Gestion
- MyWeek / Schedule
- Profile / Onboarding

### Priorité P3

- Home / marketing
- harmonisation visuelle secondaire
- nettoyage de composants UI simples

## 5. Ordre de travail recommandé pour la nuit

Ordre choisi selon:

- valeur métier
- risque de duplication
- facilité de validation
- dépendances entre écrans

### Lot FE-1: Base réseau front

Périmètre:

- créer une couche `lib/client/api`
- créer un helper générique de requête
- créer un formalisme commun d'erreur

Objectif:

- éliminer la duplication du pattern `fetch + res.ok + parsing + throw`

Actions:

- créer un helper type `requestJson`
- créer des clients par domaine:
  - `me-client`
  - `users-client`
  - `availabilities-client`
  - `services-client`
  - `slots-client`
  - `schedule-client`
- conserver les mêmes endpoints exacts

Critères de sortie:

- au moins 2 domaines branchés sur cette base
- aucune page cassée

### Lot FE-2: Domaine `services`

Périmètre:

- `app/[locale]/(routes)/(routes)/(pay)/(educator)/services/page.tsx`
- `app/[locale]/(routes)/(routes)/(app)/(client)/book/services/page.tsx`
- `components` associés si extraits

Pourquoi maintenant:

- le back `services` vient d'être refactorisé
- plusieurs écrans consomment les mêmes données

Objectif:

- mutualiser le chargement des catégories/services instructeur
- réduire les formulaires trop couplés à la page

Actions:

- créer `services-client.ts`
- créer hooks:
  - `useInstructorServices`
  - `useEditableServices` ou équivalent
- extraire:
  - liste catégories
  - formulaire service
  - formulaire catégorie
  - états de mutation

Critères de sortie:

- plus aucun `fetch('/api/me/services')` directement dans la page principale
- plus aucun `fetch('/api/me/instructor-services')` directement dans les pages `book` concernées

### Lot FE-3: Domaine `availability`

Périmètre:

- `app/[locale]/(routes)/(routes)/(app)/(educator)/availability/page.tsx`
- `components/availability-agenda.tsx`
- `components/availability/WeeklyGlobalAgenda.tsx`
- `components/availability/DailyOverridesCard.tsx`
- éventuellement `components/associate-agency-availability.tsx`

Pourquoi:

- c'est l'une des plus grosses zones de duplication et d'état local dense

Objectif:

- séparer vue, lecture des disponibilités, édition des disponibilités, lecture des exceptions journalières

Actions:

- créer `availabilities-client.ts`
- créer hooks:
  - `useWeeklyAvailabilities`
  - `useDayOverrides`
  - `useAvailabilityRoleGate`
- extraire helpers purs:
  - transformation de slots
  - regroupement par jour
  - mapping des erreurs métier en messages UI

Critères de sortie:

- composants divisés en sous-composants lisibles
- chargements séparés par responsabilité
- suppression des gros blocs réseau directement dans les composants de rendu

### Lot FE-4: Domaine `users / gestion`

Périmètre:

- `components/gestion/UserManagement.tsx`
- `components/gestion/StudentsAvailabilityHeatmap.tsx`
- `components/optimal-schedule.tsx`
- pages `gestion` et `configuration`

Objectif:

- centraliser les accès `users`
- sortir les mutations de rôle et d'heures dans des hooks dédiés

Actions:

- créer `users-client.ts`
- créer hooks:
  - `useAgencyUsers`
  - `useUserRoleMutations`
  - `useStudentHoursMutations`
- découper `UserManagement.tsx` en:
  - toolbar
  - table
  - lignes / actions
  - helpers de formatage

Critères de sortie:

- la logique d'appel `/api/users`, `/api/users/:id`, `/api/users/:id/role`, `/api/users/:id/hours` est centralisée
- l'écran gestion n'est plus un bloc monolithique

### Lot FE-5: Domaine `booking`

Périmètre:

- `book/page.tsx`
- `book/address/page.tsx`
- `book/services/page.tsx`
- `book/proposals/page.tsx`

Pourquoi:

- flow multi-écrans probablement le plus fragile
- forte duplication de chargement de services et agenda instructeur

Objectif:

- clarifier le flow de réservation
- mutualiser les accès:
  - services instructeur
  - agenda hebdo
  - agenda proposals
  - création de slot

Actions:

- créer `booking-client.ts`
- créer hooks:
  - `useBookingServices`
  - `useInstructorWeeklyAgenda`
  - `useInstructorProposalAgenda`
  - `useBookSlot`
- extraire les utilitaires de calcul de semaine/date côté front
- isoler un modèle de state partagé du flow de réservation

Critères de sortie:

- moins de duplication entre `book/page.tsx` et `book/proposals/page.tsx`
- état de réservation explicite et testable manuellement

### Lot FE-6: Domaine `myweek / schedule`

Périmètre:

- `app/[locale]/(routes)/(routes)/(app)/myweek/page.tsx`
- `components/schedule/LastWeekAgenda.tsx`
- `components/schedule/CalculatedAgendaSection.tsx`
- composants de sous-rendu associés

Objectif:

- extraire les gros composants en unités de lecture / calcul / affichage
- centraliser les appels `me/weeks`, `users`, `schedule/commit`

Actions:

- créer `schedule-client.ts`
- créer hooks:
  - `useMyWeeks`
  - `useCalculatedAgenda`
  - `useCommitSchedule`
- découper les sections:
  - header / filtres
  - liste d'élèves
  - agenda calculé
  - actions de commit

Critères de sortie:

- `LastWeekAgenda.tsx` et `CalculatedAgendaSection.tsx` raccourcis nettement
- responsabilités séparées

### Lot FE-7: Domaine `profile / onboarding`

Périmètre:

- `app/[locale]/(routes)/(routes)/(pay)/profile/page.tsx`
- `app/[locale]/(routes)/onboarding/choose-organization/page.tsx`
- intégrations Google Places si concernées

Objectif:

- isoler les flux d'adresse
- réutiliser les mêmes adapters de payload pour profil et onboarding

Actions:

- créer `profile-client.ts`
- créer `address` helpers front
- extraire:
  - chargement script maps
  - parsing adresse
  - modales d'édition

Critères de sortie:

- moins de duplication autour de l'adresse et du profil
- modales plus petites et plus testables

### Lot FE-8: Domaine `home / marketing / nav`

Périmètre:

- `app/[locale]/(routes)/home/page.tsx`
- `components/home/*`
- `components/navbar/*`

Objectif:

- simplifier le home
- rationaliser les composants marketing
- améliorer cohérence responsive et lisibilité

Actions:

- regrouper les sections marketing trop proches
- factoriser les patterns de CTA, cards, FAQ, pricing
- nettoyer la navigation desktop/mobile

Critères de sortie:

- composants home plus petits
- navigation plus claire
- aucun changement de parcours principal non voulu

## 6. Boucles de vérification à exécuter en continu

Le travail de nuit doit tourner en cycles courts.

### Boucle standard par lot

1. Lire le périmètre réel.
2. Lire `doc/dependency-cruiser/dependency-api-contracts.json` si le lot touche à l'API.
3. Identifier les routes API concernées et tous leurs callers front.
4. Identifier les duplications.
5. Extraire uniquement une couche à la fois.
6. Rebrancher sans changer les contrats.
7. Vérifier les imports cassés.
8. Vérifier les pages impactées manuellement.
9. Noter les risques restants.
10. Passer au sous-lot suivant seulement si l'écran reste stable.

### Boucle de vérification code

À faire après chaque modification significative:

- relire les diff des fichiers touchés
- vérifier qu'aucun endpoint n'a changé
- vérifier qu'aucun nom de prop critique n'a changé
- vérifier qu'aucune traduction n'a été perdue
- vérifier qu'aucun `fetch` important n'a disparu sans remplacement

### Boucle de vérification UI

Pour chaque écran touché:

- chargement initial
- état vide
- état loading
- état erreur
- état succès
- mutation principale
- refresh/reload après mutation
- responsive mobile simple

### Boucle de vérification navigation

Quand un flow comporte plusieurs pages:

- arrivée sur la page
- navigation vers l'étape suivante
- retour en arrière
- conservation minimale des données utiles
- absence d'écran bloqué ou de spinner infini

## 7. Checklist de validation par domaine

### Services

- charger les catégories et services
- créer une catégorie
- créer un service
- modifier un service
- supprimer un service
- refuser la suppression d'une catégorie non vide
- charger côté éducateur
- charger côté booking client

### Availability

- afficher la semaine type
- afficher les exceptions journalières
- créer une disponibilité
- fusionner / rafraîchir correctement
- supprimer une disponibilité
- afficher l'agenda global
- vérifier les jours sans données

### Users / Gestion

- charger la liste des users
- filtrer si nécessaire
- promotion student -> instructor
- rétrogradation instructor -> student
- interdiction de modifier soi-même
- ajout d'heures
- édition des heures
- suppression d'un user autorisée / interdite

### Booking

- charger les services instructeur
- charger l'adresse utilisateur
- charger les créneaux hebdo
- charger les propositions longues
- réserver un slot
- vérifier les états sans service ou sans créneau

### Profile / Onboarding

- charger profil
- modifier nom
- modifier adresse
- conserver la shape de profil attendue
- onboarding avec code agence
- onboarding éducateur

### Schedule / MyWeek

- charger la semaine
- afficher les blocs de planning
- calculer un agenda
- commit de planning
- état vide / état chargé / état erreur

## 8. Heuristiques pour décider quoi extraire

Extraire si au moins une condition est vraie:

- un fichier dépasse environ 300 à 400 lignes et mélange plusieurs responsabilités
- un même appel API existe dans au moins 2 composants/pages
- un même mapping de payload existe dans au moins 2 endroits
- un même bloc `loading/error/retry` est copié
- un composant a trop d'états locaux et devient difficile à relire

Ne pas extraire si:

- le code n'est utilisé qu'une fois et reste simple
- l'extraction crée plus d'indirection que de clarté
- le lot deviendrait trop large pour être vérifié dans la foulée

## 9. Dossiers et fichiers candidats à créer

### Base client

- `lib/client/api/request.ts`
- `lib/client/api/services-client.ts`
- `lib/client/api/availabilities-client.ts`
- `lib/client/api/users-client.ts`
- `lib/client/api/booking-client.ts`
- `lib/client/api/profile-client.ts`
- `lib/client/api/schedule-client.ts`

### Hooks

- `lib/client/hooks/useAsyncResource.ts`
- `lib/client/hooks/useMutationAction.ts`
- `lib/client/hooks/useInstructorServices.ts`
- `lib/client/hooks/useWeeklyAvailabilities.ts`
- `lib/client/hooks/useAgencyUsers.ts`
- `lib/client/hooks/useBookingFlow.ts`
- `lib/client/hooks/useProfile.ts`
- `lib/client/hooks/useMyWeeks.ts`

### Helpers

- `lib/client/utils/http-errors.ts`
- `lib/client/utils/date-range.ts`
- `lib/client/utils/address.ts`
- `lib/client/utils/minutes.ts`

## 10. Points d'attention spécifiques

### Traductions

- éviter d'ajouter du texte en dur dans les nouveaux composants
- garder la compatibilité `next-intl`
- noter les clés manquantes au fil de l'eau

### Server / Client boundaries

- ne pas transformer une page server en page client sans raison
- ne pas déplacer du code sensible côté client
- laisser les pages server faire la composition quand c'est utile

### Google Maps / scripts externes

- centraliser le chargement des scripts
- éviter les doubles injections du script places/maps

### Clerk

- éviter la duplication des vérifications `isLoaded`, `isSignedIn`, `userId`
- créer des helpers front si ce pattern revient trop souvent

## 11. Plan d'exécution autonome pour la nuit

### Séquence recommandée

1. Mettre en place `lib/client/api/request.ts` et les premiers clients.
2. Refactoriser `services`.
3. Valider `services` manuellement.
4. Refactoriser `availability`.
5. Valider `availability`.
6. Refactoriser `booking`.
7. Valider `booking`.
8. Refactoriser `users/gestion`.
9. Valider `gestion`.
10. Refactoriser `myweek/schedule`.
11. Valider `myweek/schedule`.
12. Refactoriser `profile/onboarding`.
13. Valider `profile/onboarding`.
14. Finir par le `home` et la navigation.

### Règle d'arrêt d'un lot

Stopper le lot si:

- le comportement devient ambigu
- plus de 4 fichiers critiques sont cassés simultanément
- une extraction commence à imposer une refonte globale
- les vérifications manuelles échouent sur un parcours principal

Dans ce cas:

- revenir au dernier état stable du lot
- réduire le périmètre
- reprendre avec une extraction plus petite

## 12. Critères de succès au matin

Le plan de nuit est réussi si:

- les gros composants sont visiblement plus petits ou mieux séparés
- les appels API sont majoritairement sortis des pages
- les domaines `services`, `availability` et `booking` ont une structure claire
- les parcours critiques restent testables manuellement sans régression évidente
- la lecture du front donne une sensation de code plus stable et moins dispersé

## 13. Première action recommandée

Commencer par:

- créer la base `lib/client/api/request.ts`
- brancher un premier domaine simple et à forte valeur: `services`

Pourquoi:

- surface limitée
- back déjà stabilisé
- utilité immédiate pour les écrans éducateur et booking
