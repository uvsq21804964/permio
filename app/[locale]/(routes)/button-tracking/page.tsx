import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import type { Locale } from '@/src/lib/i18n';

import {
  ButtonTrackingDashboardClient,
  type ButtonTrackingDashboardCopy,
} from './ButtonTrackingDashboardClient';

type PageProps = {
  params: Promise<{ locale: Locale }>;
};

function getCopy(locale: Locale): ButtonTrackingDashboardCopy {
  if (locale === 'fr') {
    return {
      title: 'Tracking des boutons',
      subtitle:
        'Tableau de bord pour suivre les clics sur les boutons du site, identifier les parcours et voir les zones qui performent le mieux.',
      unlockTitle: 'Acces protege',
      unlockBody:
        'Entre le meme mot de passe que pour le tracking email. Il sera enregistre localement sur ce navigateur.',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Saisis EMAIL_TRACKING_WRITE_TOKEN',
      unlockAction: 'Deverrouiller',
      disconnectAction: 'Oublier le mot de passe',
      deleteAllAction: 'Supprimer les donnees',
      deleteAllLoading: 'Suppression...',
      deleteAllConfirm:
        'Supprimer toutes les donnees de tracking des boutons ? Cette action est irreversible.',
      deleteAllSuccess: 'Les donnees de tracking des boutons ont ete supprimees.',
      deleteAllError:
        'Impossible de supprimer les donnees de tracking des boutons pour le moment.',
      invalidPassword: 'Mot de passe incorrect.',
      loading: 'Chargement du tracking...',
      genericError: 'Impossible de charger le tracking des boutons pour le moment.',
      backToDemo: 'Retour a la demo',
      trackedButtonHint:
        'Utilise le composant TrackedButton pour enregistrer les clics avec le contexte, la page, la cible et les infos utilisateur disponibles.',
      totalClicks: 'Clics totaux',
      uniqueButtons: 'Boutons distincts',
      uniquePages: 'Pages touchees',
      uniqueUsers: 'Utilisateurs identifies',
      authenticatedClicks: 'Clics connectes',
      anonymousClicks: 'Clics anonymes',
      clicksLast24Hours: 'Dernieres 24h',
      clicksLast7Days: 'Derniers 7 jours',
      topButtonsTitle: 'Boutons les plus cliques',
      topPagesTitle: 'Pages les plus actives',
      topUsersTitle: 'Utilisateurs les plus actifs',
      recentEventsTitle: 'Derniers evenements',
      journeyTitle: 'Parcours utilisateur',
      journeyBody:
        'Selectionne un utilisateur pour visualiser les pages visitees, les boutons cliques et le temps passe avant le changement de page.',
      journeySelectLabel: 'Utilisateur',
      journeySelectPlaceholder: 'Choisir un utilisateur',
      journeyEmpty: 'Aucun parcours disponible pour cet utilisateur.',
      journeyEventColumn: 'Evenement',
      journeyDurationColumn: 'Temps sur page',
      eventPageView: 'Page visitee',
      eventPageLeave: 'Page quittee',
      eventButtonClick: 'Bouton clique',
      buttonColumn: 'Bouton',
      contextColumn: 'Contexte',
      clicksColumn: 'Clics',
      visitorsColumn: 'Visiteurs',
      latestClickColumn: 'Dernier clic',
      pageColumn: 'Page',
      userColumn: 'Utilisateur',
      roleColumn: 'Role',
      uniqueButtonsColumn: 'Boutons uniques',
      targetColumn: 'Cible',
      metadataColumn: 'Metadonnees',
      timeColumn: 'Date',
      noData: 'Aucune donnee de tracking pour le moment.',
      anonymousLabel: 'Anonyme',
      authenticatedLabel: 'Connecte',
      docsTitle: 'Utilisation',
      docsBody:
        'Branche TrackedButton sur les CTA importants du site pour reconstruire le parcours utilisateur dans ce tableau de bord.',
      exampleTitle: 'Exemple',
    };
  }

  return {
    title: 'Button tracking',
    subtitle:
      'Dashboard to monitor button clicks across the site, identify journeys, and see which areas perform best.',
    unlockTitle: 'Protected access',
    unlockBody:
      'Enter the same password as the email tracking dashboard. It will be stored locally in this browser.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter EMAIL_TRACKING_WRITE_TOKEN',
    unlockAction: 'Unlock',
    disconnectAction: 'Forget password',
    deleteAllAction: 'Delete data',
    deleteAllLoading: 'Deleting...',
    deleteAllConfirm:
      'Delete all button tracking data? This action cannot be undone.',
    deleteAllSuccess: 'Button tracking data was deleted.',
    deleteAllError: 'Unable to delete button tracking data right now.',
    invalidPassword: 'Incorrect password.',
    loading: 'Loading tracking...',
    genericError: 'Unable to load button tracking right now.',
    backToDemo: 'Back to demo',
    trackedButtonHint:
      'Use the TrackedButton component to record clicks with context, page, destination, and available user information.',
    totalClicks: 'Total clicks',
    uniqueButtons: 'Unique buttons',
    uniquePages: 'Touched pages',
    uniqueUsers: 'Identified users',
    authenticatedClicks: 'Signed-in clicks',
    anonymousClicks: 'Anonymous clicks',
    clicksLast24Hours: 'Last 24 hours',
    clicksLast7Days: 'Last 7 days',
    topButtonsTitle: 'Most clicked buttons',
    topPagesTitle: 'Most active pages',
    topUsersTitle: 'Most active users',
      recentEventsTitle: 'Recent events',
      journeyTitle: 'User journey',
      journeyBody:
        'Select a user to see visited pages, clicked buttons, and time spent before changing pages.',
      journeySelectLabel: 'User',
      journeySelectPlaceholder: 'Choose a user',
      journeyEmpty: 'No journey available for this user yet.',
      journeyEventColumn: 'Event',
      journeyDurationColumn: 'Time on page',
      eventPageView: 'Page viewed',
      eventPageLeave: 'Page left',
      eventButtonClick: 'Button clicked',
      buttonColumn: 'Button',
    contextColumn: 'Context',
    clicksColumn: 'Clicks',
    visitorsColumn: 'Visitors',
    latestClickColumn: 'Latest click',
    pageColumn: 'Page',
    userColumn: 'User',
    roleColumn: 'Role',
    uniqueButtonsColumn: 'Unique buttons',
    targetColumn: 'Target',
    metadataColumn: 'Metadata',
    timeColumn: 'Time',
    noData: 'No tracking data yet.',
    anonymousLabel: 'Anonymous',
    authenticatedLabel: 'Signed in',
    docsTitle: 'Usage',
    docsBody:
      'Wire TrackedButton into important CTAs across the site to reconstruct user journeys in this dashboard.',
    exampleTitle: 'Example',
  };
}

export default async function ButtonTrackingPage({ params }: PageProps) {
  const { locale } = await params;
  const copy = getCopy(locale);
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  return <ButtonTrackingDashboardClient locale={locale} copy={copy} />;
}
