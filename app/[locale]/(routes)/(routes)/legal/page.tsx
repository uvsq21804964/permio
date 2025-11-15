// app/legal/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';

/** =========
 *  Variables (à personnaliser)
 *  ========= */
const LEGAL = {
  updatedAt: '2 novembre 2025',

  company: {
    name: 'Magic Hango',
    legalForm: 'SAS',
    capital: '10 000 €',
    siren: '123 456 789',
    vat: 'FR12 345678901',
    address: '12 rue des Horaires, 75002 Paris, France',
    publicationDirector: 'Jane Doe, Présidente',
    cityCourt: 'Paris',
  },

  product: {
    name: 'Permio',
    description: 'Logiciel de planification et d’optimisation d’agendas',
  },

  contacts: {
    supportEmail: 'support@acme.co',
    privacyEmail: 'privacy@acme.co',
    phone: '+33 1 23 45 67 89',
    postalAddress: '12 rue des Horaires, 75002 Paris, France',
  },

  hosting: {
    provider: 'Vercel Inc.',
    address: '340 S Lemon Ave #4133, Walnut, CA 91789',
    country: 'États-Unis',
  },

  payments: {
    processor: 'Stripe',
    means: 'CB / Visa / Mastercard',
  },

  cookies: {
    consentPagePath: '', // laisse vide si tu n’as pas de page
  },

  analytics: {
    name: 'PostHog', // ou 'Matomo', 'Plausible', etc. Laisse vide si non utilisé
  },

  sla: {
    availability: '99,5 % / mois',
    supportResponseTime: '< 1 jour ouvré',
  },
} as const;

/** =========
 *  Metadata
 *  ========= */
export const metadata: Metadata = {
  title: `Mentions légales, CGU/CGV & Confidentialité – ${LEGAL.product.name}`,
  description:
    "Mentions légales, conditions d'utilisation et de vente, politique de confidentialité et cookies.",
};

export default function LegalPage() {
  const hasCookiePage = Boolean(LEGAL.cookies.consentPagePath);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Mentions légales, CGU/CGV & Confidentialité
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Dernière mise à jour : {LEGAL.updatedAt}
        </p>

        {/* Sommaire */}
        <nav
          aria-label="Sommaire"
          className="mt-6 rounded-xl border bg-white/50 p-4 text-sm"
        >
          <ol className="space-y-2 list-decimal list-inside">
            <li>
              <a
                className="underline hover:no-underline"
                href="#mentions-legales"
              >
                Mentions légales
              </a>
            </li>
            <li>
              <a className="underline hover:no-underline" href="#cgu-cgv">
                Conditions Générales d’Utilisation et de Vente (CGU/CGV)
              </a>
            </li>
            <li>
              <a
                className="underline hover:no-underline"
                href="#confidentialite"
              >
                Politique de confidentialité (RGPD)
              </a>
            </li>
            <li>
              <a className="underline hover:no-underline" href="#cookies">
                Politique Cookies
              </a>
            </li>
            <li>
              <a className="underline hover:no-underline" href="#facturation">
                Facturation & paiements
              </a>
            </li>
            <li>
              <a className="underline hover:no-underline" href="#contact">
                Contact
              </a>
            </li>
          </ol>
        </nav>
      </header>

      {/* Mentions légales */}
      <section id="mentions-legales" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">Mentions légales</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-800">
          <p>
            <span className="font-medium">Éditeur&nbsp;:</span>{' '}
            {LEGAL.company.name} — {LEGAL.company.legalForm} au capital de{' '}
            {LEGAL.company.capital}. RCS / SIREN&nbsp;: {LEGAL.company.siren} —
            TVA intracommunautaire&nbsp;: {LEGAL.company.vat}.
          </p>
          <p>
            <span className="font-medium">Siège social&nbsp;:</span>{' '}
            {LEGAL.company.address}
          </p>
          <p>
            <span className="font-medium">Contact&nbsp;:</span>{' '}
            <a
              className="underline"
              href={`mailto:${LEGAL.contacts.supportEmail}`}
            >
              {LEGAL.contacts.supportEmail}
            </a>{' '}
            | {LEGAL.contacts.phone}
          </p>
          <p>
            <span className="font-medium">
              Directeur de la publication&nbsp;:
            </span>{' '}
            {LEGAL.company.publicationDirector}
          </p>
          <p>
            <span className="font-medium">Hébergement&nbsp;:</span>{' '}
            {LEGAL.hosting.provider}, {LEGAL.hosting.address},{' '}
            {LEGAL.hosting.country}
          </p>
        </div>
      </section>

      <hr className="my-8" />

      {/* CGU/CGV */}
      <section id="cgu-cgv" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">
          Conditions Générales d’Utilisation et de Vente (CGU/CGV)
        </h2>

        <details className="mt-4 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            1. Objet
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Le service{' '}
              <span className="font-medium">{LEGAL.product.name}</span> (le
              «&nbsp;Service&nbsp;») est un logiciel en ligne de{' '}
              <span className="font-medium">{LEGAL.product.description}</span>{' '}
              destiné aux professionnels/établissements. Le Service n’est pas un
              outil de prise de rendez-vous grand public.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            2. Compte & accès
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Authentification via <span className="font-medium">Clerk</span>.
              Vous garantissez l’exactitude des informations et la protection de
              vos identifiants. Vous restez responsable des activités réalisées
              via votre compte.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            3. Offres & tarifs
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Offres&nbsp;: <em>Gratuit</em>, <em>Starter</em>, <em>Pro</em>,{' '}
              <em>Full Magic</em>. Les prix sont affichés en{' '}
              <span className="font-medium">EUR (€)</span> ou{' '}
              <span className="font-medium">$</span> selon votre choix.
            </p>
            <p>
              Paiement via{' '}
              <span className="font-medium">{LEGAL.payments.processor}</span>.
              Sauf mention contraire, les prix sont hors taxes et la TVA/local
              tax s’applique selon votre juridiction.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            4. Essai gratuit
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Les offres payantes peuvent inclure un{' '}
              <span className="font-medium">essai de 30 jours</span> sans
              engagement. À l’issue, l’abonnement démarre automatiquement sauf
              résiliation avant la fin de l’essai.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            5. Durée – Résiliation
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Abonnement mensuel à tacite reconduction. Résiliation à tout
              moment depuis le{' '}
              <span className="font-medium">Portail client Stripe</span> (effet
              à la fin de la période en cours).
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            6. Droit de rétractation & remboursements
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Le Service cible des utilisateurs professionnels (B2B) : pas de
              droit de rétractation. Pour les consommateurs, application du
              cadre légal (14 jours), potentiellement révoqué en cas
              d’activation du service numérique avant terme.
            </p>
            <p>Pas de remboursement des périodes entamées.</p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            7. Utilisation acceptable, propriété intellectuelle, responsabilité
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Interdits : activités illégales, atteinte aux droits de tiers,
              contournement des mesures techniques, accès non autorisé.
            </p>
            <p>
              Propriété intellectuelle : le logiciel, les marques et contenus
              appartiennent à{' '}
              <span className="font-medium">{LEGAL.company.name}</span> ou à ses
              concédants. Vous conservez la propriété de vos données client et
              nous accordez une licence d’usage pour fournir le Service.
            </p>
            <p>
              Responsabilité totale cumulée limitée aux montants payés sur les
              12 derniers mois. Exclusion des dommages indirects, dans la mesure
              permise par la loi.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            8. Loi applicable – Juridiction
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Droit <span className="font-medium">français</span>. Compétence
              exclusive des tribunaux de{' '}
              <span className="font-medium">{LEGAL.company.cityCourt}</span>,
              sous réserve des règles impératives.
            </p>
          </div>
        </details>
      </section>

      <hr className="my-8" />

      {/* Confidentialité */}
      <section id="confidentialite" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">
          Politique de confidentialité (RGPD)
        </h2>

        <details className="mt-4 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            1. Responsable & finalités
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Responsable de traitement :{' '}
              <span className="font-medium">{LEGAL.company.name}</span>,{' '}
              {LEGAL.company.address},{' '}
              <a
                className="underline"
                href={`mailto:${LEGAL.contacts.privacyEmail}`}
              >
                {LEGAL.contacts.privacyEmail}
              </a>
              .
            </p>
            <p>
              Finalités : gestion de comptes, fourniture du Service, facturation
              ({LEGAL.payments.processor}), support, sécurité, amélioration
              produit, statistiques agrégées, communications (sur consentement
              pour le marketing).
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            2. Bases légales & données
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Bases légales : contrat, intérêt légitime, consentement,
              obligation légale.
            </p>
            <p>
              Données traitées : identité & contact, authentification (Clerk),
              usage & logs, facturation ({LEGAL.payments.processor}), contenus
              fournis par l’utilisateur.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            3. Sous-traitants & transferts
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Principaux sous-traitants : Clerk (auth),{' '}
              {LEGAL.payments.processor} (paiement)
              {LEGAL.hosting.provider
                ? `, ${LEGAL.hosting.provider} (hébergement)`
                : ''}
              {LEGAL.analytics.name
                ? `, ${LEGAL.analytics.name} (analytics)`
                : ''}
              . Transferts hors UE encadrés par SCC et mesures complémentaires.
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            4. Durées de conservation & sécurité
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Facturation/comptabilité : 10 ans (droit français). Autres : durée
              du contrat + périodes légales.
            </p>
            <p>
              Mesures techniques & organisationnelles (chiffrement en transit,
              gestion des accès, sauvegardes).
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            5. Vos droits
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>
              Droits RGPD : accès, rectification, effacement, opposition,
              limitation, portabilité, directives post-mortem. Contact :{' '}
              <a
                className="underline"
                href={`mailto:${LEGAL.contacts.privacyEmail}`}
              >
                {LEGAL.contacts.privacyEmail}
              </a>
              . Réclamation :{' '}
              <a className="underline" href="https://www.cnil.fr/">
                CNIL
              </a>
              .
            </p>
          </div>
        </details>

        <details className="mt-3 rounded-xl border p-4 open:bg-gray-50">
          <summary className="cursor-pointer text-base font-medium">
            6. Mineurs
          </summary>
          <div className="mt-3 space-y-2 text-sm text-gray-800">
            <p>Service non destiné aux moins de 16 ans.</p>
          </div>
        </details>
      </section>

      <hr className="my-8" />

      {/* Cookies */}
      <section id="cookies" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">Politique Cookies</h2>

        <div className="mt-4 space-y-2 text-sm text-gray-800">
          <p>
            Nous utilisons des cookies nécessaires au fonctionnement du Service.
            Les cookies de mesure d’audience et marketing ne sont déposés
            qu’avec votre consentement.
          </p>
          {hasCookiePage && (
            <p>
              Vous pouvez gérer vos préférences à tout moment via{' '}
              <Link href={LEGAL.cookies.consentPagePath!} className="underline">
                Gérer mes cookies
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      <hr className="my-8" />

      {/* Facturation & paiements */}
      <section id="facturation" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">Facturation & paiements</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-800">
          <p>
            Prestataire :{' '}
            <span className="font-medium">{LEGAL.payments.processor}</span>.{' '}
            Moyens acceptés : {LEGAL.payments.means}. Devise : € ou $ selon
            votre sélection. Les factures sont disponibles dans le Portail
            client Stripe et envoyées par email.
          </p>
          <p>
            Les taxes applicables (TVA, etc.) sont calculées selon votre
            juridiction. Les changements d’offre sont gérés au prorata (si
            activé).
          </p>
        </div>
      </section>

      <hr className="my-8" />

      {/* Contact */}
      <section id="contact" className="scroll-mt-24">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <div className="mt-4 space-y-2 text-sm text-gray-800">
          <p>
            Support :{' '}
            <a
              className="underline"
              href={`mailto:${LEGAL.contacts.supportEmail}`}
            >
              {LEGAL.contacts.supportEmail}
            </a>
          </p>
          <p>
            DPO / Privacy :{' '}
            <a
              className="underline"
              href={`mailto:${LEGAL.contacts.privacyEmail}`}
            >
              {LEGAL.contacts.privacyEmail}
            </a>
          </p>
          <p>Adresse postale : {LEGAL.contacts.postalAddress}</p>
        </div>
      </section>

      {/* Pied de page interne */}
      <footer className="mt-10 border-t pt-6 text-xs text-gray-500">
        <div className="flex flex-wrap items-center gap-3">
          <a className="underline" href="#cgu-cgv">
            CGU/CGV
          </a>
          <a className="underline" href="#confidentialite">
            Confidentialité
          </a>
          <a className="underline" href="#cookies">
            Cookies
          </a>
          <a className="underline" href="#mentions-legales">
            Mentions légales
          </a>
          {hasCookiePage && (
            <Link className="underline" href={LEGAL.cookies.consentPagePath!}>
              Gérer mes cookies
            </Link>
          )}
        </div>
        <p className="mt-3">
          © {new Date().getFullYear()} {LEGAL.company.name}
        </p>
      </footer>
    </main>
  );
}
