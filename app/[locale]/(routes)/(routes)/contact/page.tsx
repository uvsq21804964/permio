// app/(marketing)/contact/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contactez-nous : démo, support, partenariat, optimisations.',
};

const CONTACT = {
  email: 'tomabbouz@outlook.com',
  phoneDisplay: '+33 6 59 57 33 45',
  phoneE164: '+33659573345',
};

const subject = encodeURIComponent('Demande d’information / Démo');
const body = encodeURIComponent(
  [
    'Bonjour,',
    '',
    'J’aimerais vous contacter au sujet de l’optimisation d’agenda et de trajets.',
    'Mon contexte :',
    '- Nombre d’élèves/clients : ',
    '- Zones / villes : ',
    '- Outils actuels : ',
    '',
    'Merci !',
  ].join('\n')
);

const whatsappText = encodeURIComponent(
  [
    'Bonjour 👋',
    'Je souhaite des infos sur l’outil (planning + optimisation des trajets).',
    'Contexte rapide : [élèves/clients, zones, outils] ',
  ].join(' — ')
);

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#f9ffc6] px-4 py-16 md:py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-6 md:grid-cols-5">
        {/* Colonne gauche : formulaire */}
        <section className="md:col-span-3">
          <div className="rounded-2xl border border-black/10 bg-white/85 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
            <header className="mb-6 text-center md:text-left">
              <h1
                className="text-2xl md:text-3xl font-semibold text-black break-words"
                style={{ hyphens: 'auto' }}
              >
                Contact
              </h1>
              <p
                className="mt-2 text-sm text-black/70 break-words"
                style={{ hyphens: 'auto' }}
              >
                Une question, une démo, un partenariat ? Écris-nous, réponse
                sous 24 à 48h ouvrées.
              </p>
            </header>

            <form
              action="/api/contact"
              method="POST"
              className="space-y-4"
              autoComplete="on"
              noValidate
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-black"
                  >
                    Nom
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Ex. Marie Dupont"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-black"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="vous@exemple.com"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-black"
                  >
                    Téléphone (optionnel)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-black"
                  >
                    Sujet
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-black/60"
                    defaultValue="demo"
                  >
                    <option value="demo">Demande de démo</option>
                    <option value="support">
                      Support / Problème technique
                    </option>
                    <option value="billing">Facturation / Abonnement</option>
                    <option value="partnership">
                      Partenariat / Intégration
                    </option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-black"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder="Décrivez votre besoin, votre organisation, vos zones, etc."
                  className="mt-1 w-full rounded-xl border border-black/15 bg-white/95 px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/60 break-words"
                  style={{ hyphens: 'auto' }}
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  name="consent"
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 rounded border-black/30 text-black focus:ring-black/60"
                />
                <label htmlFor="consent" className="text-sm text-black/70">
                  J’accepte d’être contacté·e à propos de ma demande. Mes
                  données seront traitées selon la{' '}
                  <Link href="/legal" className="underline underline-offset-4">
                    politique de confidentialité
                  </Link>
                  .
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className={[
                    'inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold',
                    'border border-black/25 text-black',
                    'bg-white/95 hover:bg-white',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/70 focus-visible:ring-offset-2',
                    'motion-safe:transition motion-safe:duration-200',
                  ].join(' ')}
                >
                  Envoyer la demande
                </button>
              </div>

              <p className="text-xs text-black/60">
                Nous répondons généralement sous 24 à 48h.
              </p>
            </form>
          </div>
        </section>

        {/* Colonne droite : moyens de contact + idées */}
        <aside className="md:col-span-2">
          <div className="rounded-2xl border border-black/10 bg-white/85 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
            <h2 className="text-lg font-semibold text-black">
              Autres moyens de contact
            </h2>

            <ul className="mt-4 space-y-3 text-sm">
              <li className="break-words" style={{ hyphens: 'auto' }}>
                📧 Email :{' '}
                <Link
                  href={`mailto:${CONTACT.email}?subject=${subject}&body=${body}`}
                  className="underline"
                >
                  {CONTACT.email}
                </Link>
              </li>
              <li>
                📞 Téléphone :{' '}
                <Link href={`tel:${CONTACT.phoneE164}`} className="underline">
                  {CONTACT.phoneDisplay}
                </Link>
              </li>
              <li className="break-words">
                💬 WhatsApp :{' '}
                <Link
                  href={`https://wa.me/${CONTACT.phoneE164.replace(
                    '+',
                    ''
                  )}?text=${whatsappText}`}
                  target="_blank"
                  className="underline"
                >
                  Ouvrir la conversation
                </Link>
              </li>
            </ul>

            <div className="mt-6 border-t border-black/10 pt-6">
              <h3 className="text-sm font-semibold text-black">
                Idées de sujets pour nous solliciter
              </h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-black/80">
                <li>Réserver une démo guidée (30 min) sur votre cas réel.</li>
                <li>
                  Configurer vos disponibilités et votre page de réservation.
                </li>
                <li>Réduire les trajets en regroupant par zones/jours.</li>
                <li>
                  Régler les no-shows (rappels, politique d’annulation, arrhes
                  Stripe).
                </li>
                <li>
                  Intégrer Google/Outlook Calendar et synchroniser vos
                  événements.
                </li>
                <li>
                  Importer vos élèves/clients (CSV/Google Contacts) et nettoyer
                  les adresses.
                </li>
                <li>
                  Optimiser les créneaux “trou” pour remplir la journée sans
                  sur-trajets.
                </li>
                <li>
                  Questions facturation/abonnement (upgrade, factures, TVA,
                  coupons).
                </li>
                <li>
                  Partenariat (écoles, réseaux de professeurs, intégrateurs).
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
