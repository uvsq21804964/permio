import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import type { Locale } from '@/src/lib/i18n';

import {
  EmailTrackingDashboardClient,
  type EmailTrackingDashboardCopy,
} from './EmailTrackingDashboardClient';

type PageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
};

function getCopy(locale: Locale): EmailTrackingDashboardCopy {
  if (locale === 'fr') {
    return {
      title: 'Suivi des emails',
      subtitle:
        'Tableau de bord pour suivre les emails envoyes par ton script et voir qui a ouvert le pixel de tracking.',
      backToDemo: 'Retour a la demo',
      docsTitle: 'A brancher dans le script',
      docsBody:
        'Le pixel fonctionne deja avec /track/open?id=.... Pour voir aussi les emails envoyes mais pas encore ouverts, le script peut appeler l endpoint POST /api/email-tracking/register juste apres chaque envoi SMTP.',
      searchPlaceholder: 'Rechercher un email, un sujet ou un tracking id',
      filterAll: 'Tous',
      filterOpened: 'Mails ouverts',
      filterPending: 'Mails non ouverts',
      filterClicked: 'Liens ouverts',
      filterNotClicked: 'Liens non ouverts',
      tracked: 'Emails trackes',
      opened: 'Mails ouverts',
      clicked: 'Liens ouverts',
      pending: 'Pas encore ouverts',
      totalOpens: 'Ouvertures de mails',
      totalLinkOpens: 'Ouvertures de liens',
      openRate: 'Taux d ouverture',
      linkOpenRate: 'Taux de clic',
      recipient: 'Destinataire',
      subject: 'Sujet',
      sentAt: 'Envoye',
      latestOpen: 'Derniere ouverture mail',
      latestClick: 'Dernier lien ouvert',
      status: 'Statut',
      empty: 'Aucun email ne correspond a ce filtre pour le moment.',
      statusOpened: 'Mail ouvert',
      statusPending: 'Mail non ouvert',
      statusClicked: 'Lien ouvert',
      statusNotClicked: 'Lien non ouvert',
      tableHint:
        'Les mails ouverts viennent du pixel de tracking. Les liens ouverts viennent de la route intermediaire /track/redirect.',
      unlockTitle: 'Acces protege',
      unlockBody:
        'Entre le mot de passe du tracking email pour deverrouiller cette page. Il sera enregistre localement sur ce navigateur.',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: 'Saisis EMAIL_TRACKING_WRITE_TOKEN',
      unlockAction: 'Deverrouiller',
      disconnectAction: 'Oublier le mot de passe',
      deleteAllAction: 'Supprimer les donnees',
      deleteAllLoading: 'Suppression...',
      deleteAllConfirm:
        'Supprimer toutes les donnees de tracking email ? Cette action est irreversible.',
      deleteAllSuccess: 'Les donnees de tracking ont ete supprimees.',
      deleteAllError: 'Impossible de supprimer les donnees de tracking pour le moment.',
      loading: 'Chargement du tracking...',
      invalidPassword: 'Mot de passe incorrect.',
      genericError: 'Impossible de charger le tracking pour le moment.',
      noSubject: 'Sujet non enregistre',
      expectedTrackingId: 'Tracking ID attendu',
      filterAction: 'Filtrer',
      pixelInfo: 'Compteur d ouverture declenche par le pixel dans le HTML.',
      registerInfo:
        'Optionnel mais recommande pour afficher aussi les emails envoyes avant leur premiere ouverture.',
      redirectInfo:
        'Route intermediaire pour tracer le clic sur un lien d email puis rediriger vers la vraie URL sans laisser l identifiant de tracking dans l adresse finale.',
      totalRecipients: 'Destinataires suivis',
      recipientsWithAccount: 'Destinataires avec compte',
      convertedAfterReminder: 'Comptes crees apres relance',
      unnecessaryReminderEmails: 'Relances inutiles',
      avgEmailsBeforeSignup: 'Mails moyens avant inscription',
      conversionSectionTitle: 'Conversion et relances',
      conversionSectionBody:
        'Vue par destinataire pour reperer qui convertit apres combien de mails et qui recoit encore des relances alors qu un compte existe deja.',
      conversionRecipient: 'Destinataire',
      conversionAccountStatus: 'Etat du compte',
      conversionBeforeSignup: 'Mails / relances avant inscription',
      conversionUselessReminders: 'Relances inutiles',
      conversionLastEmail: 'Dernier email',
      conversionEmpty: 'Aucun destinataire ne correspond a cette recherche.',
      accountCreated: 'Compte cree',
      accountMissing: 'Pas de compte',
      accountAlreadyExisted: 'Compte deja cree',
      convertedAfterFirstEmail: 'Converti apres 1 email',
      convertedAfterSeveralEmails: 'Converti apres relance',
      noEmailsBeforeSignup: '0 / 0',
      uselessReminderBadge: 'a couper',
      recipientInsightHint:
        'Lecture rapide: "mails / relances avant inscription" permet de voir au bout de combien de rappels la creation de compte a eu lieu.',
    };
  }

  return {
    title: 'Email tracking',
    subtitle:
      'Dashboard to monitor emails sent by your script and see who loaded the tracking pixel.',
    backToDemo: 'Back to demo',
    docsTitle: 'How to wire the script',
    docsBody:
      'The pixel already works with /track/open?id=.... To also display sent emails that have not been opened yet, the script can call POST /api/email-tracking/register right after each SMTP send.',
    searchPlaceholder: 'Search by email, subject, or tracking id',
    filterAll: 'All',
    filterOpened: 'Emails opened',
    filterPending: 'Emails unopened',
    filterClicked: 'Links opened',
    filterNotClicked: 'Links unopened',
    tracked: 'Tracked emails',
    opened: 'Emails opened',
    clicked: 'Links opened',
    pending: 'Not opened yet',
    totalOpens: 'Email opens',
    totalLinkOpens: 'Link opens',
    openRate: 'Open rate',
    linkOpenRate: 'Click rate',
    recipient: 'Recipient',
    subject: 'Subject',
    sentAt: 'Sent',
    latestOpen: 'Latest email open',
    latestClick: 'Latest link open',
    status: 'Status',
    empty: 'No email matches this filter yet.',
    statusOpened: 'Email opened',
    statusPending: 'Email unopened',
    statusClicked: 'Link opened',
    statusNotClicked: 'Link unopened',
    tableHint:
      'Email opens come from the tracking pixel. Link opens come from the intermediate /track/redirect route.',
    unlockTitle: 'Protected access',
    unlockBody:
      'Enter the password to unlock this page. It will be stored locally in this browser.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    unlockAction: 'Unlock',
    disconnectAction: 'Forget password',
    deleteAllAction: 'Delete data',
    deleteAllLoading: 'Deleting...',
    deleteAllConfirm:
      'Delete all email tracking data? This action cannot be undone.',
    deleteAllSuccess: 'Email tracking data was deleted.',
    deleteAllError: 'Unable to delete email tracking data right now.',
    loading: 'Loading tracking...',
    invalidPassword: 'Incorrect password.',
    genericError: 'Unable to load email tracking right now.',
    noSubject: 'No subject registered',
    expectedTrackingId: 'Expected tracking ID',
    filterAction: 'Filter',
    pixelInfo: 'Open counter triggered by the pixel in the HTML.',
    registerInfo:
      'Optional but recommended to display sent emails before their first open.',
    redirectInfo:
      'Intermediate route to track an email link click and then redirect to the real URL without leaving the tracking identifier in the final address.',
    totalRecipients: 'Tracked recipients',
    recipientsWithAccount: 'Recipients with account',
    convertedAfterReminder: 'Accounts created after reminder',
    unnecessaryReminderEmails: 'Unnecessary reminders',
    avgEmailsBeforeSignup: 'Avg emails before signup',
    conversionSectionTitle: 'Conversion and reminders',
    conversionSectionBody:
      'Recipient-level view to spot who converts after how many emails and who still receives reminders even though an account already exists.',
    conversionRecipient: 'Recipient',
    conversionAccountStatus: 'Account status',
    conversionBeforeSignup: 'Emails / reminders before signup',
    conversionUselessReminders: 'Unnecessary reminders',
    conversionLastEmail: 'Latest email',
    conversionEmpty: 'No recipient matches this search.',
    accountCreated: 'Account created',
    accountMissing: 'No account',
    accountAlreadyExisted: 'Account already existed',
    convertedAfterFirstEmail: 'Converted after first email',
    convertedAfterSeveralEmails: 'Converted after reminder',
    noEmailsBeforeSignup: '0 / 0',
    uselessReminderBadge: 'should stop',
    recipientInsightHint:
      'Quick read: "emails / reminders before signup" shows after how many follow-ups the account creation happened.',
  };
}

export default async function EmailTrackingPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const copy = getCopy(locale);
  const { userId } = await auth();

  if (!userId) {
    redirect(`/${locale}/sign-in`);
  }

  const statusFilter =
    resolvedSearchParams.status === 'opened'
      ? 'opened'
      : resolvedSearchParams.status === 'pending'
        ? 'pending'
        : resolvedSearchParams.status === 'clicked'
          ? 'clicked'
          : resolvedSearchParams.status === 'not-clicked'
            ? 'not-clicked'
            : 'all';

  return (
    <EmailTrackingDashboardClient
      locale={locale}
      copy={copy}
      initialQuery={resolvedSearchParams.q || ''}
      initialStatus={statusFilter}
    />
  );
}
