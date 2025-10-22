// src/i18n/clerk.ro.ts
import type { LocalizationResource } from '@clerk/types';
import { roRO as roBase } from '@clerk/localizations';

export const roRO: LocalizationResource = {
  ...roBase,

  // ==== OVERRIDES NIVEAU RACINE (autorisés par le type) ====
  // Libellés génériques de champs et boutons:
  formFieldLabel__emailAddress: 'Adresă de e-mail',
  formFieldLabel__password: 'Parolă',
  formButtonPrimary: 'Continuă', // <- bouton principal générique
  backButton: 'Înapoi',
  signOut: 'Deconectare',
  dividerText: 'sau',

  // ==== SIGN IN ====
  signIn: {
    ...roBase.signIn,
    start: {
      ...roBase.signIn?.start,
      title: 'Autentificare',
      subtitle: 'Continuați cu e-mailul sau un furnizor',
      actionText: 'Nu ai cont?',
      actionLink: 'Înregistrează-te',
    },
    alternativeMethods: {
      ...roBase.signIn?.alternativeMethods,
      actionLink: 'Folosește o altă metodă',
      // Boutons “continua cu …”
      blockButton__password: 'Continuă cu parolă',
      blockButton__emailLink: 'Continuă prin link pe e-mail',
      blockButton__resetPassword: 'Resetează parola',
    },
    // ⚠️ Ne pas ajouter ici "password" / "emailAddress" en objets avec {label, placeholder} :
    // ces chemins ne sont pas acceptés par ton type actuel.
  },

  // ==== SIGN UP ====
  signUp: {
    ...roBase.signUp,
    start: {
      ...roBase.signUp?.start,
      title: 'Creează un cont',
      subtitle: 'Este rapid și gratuit',
      actionText: 'Ai deja cont?',
      actionLink: 'Autentifică-te',
    },
    // ⚠️ Ne pas mettre formButtonPrimary ici (utilise le root ci-dessus).
    // Idem: pas de sous-objets "password"/"emailAddress" à ce niveau.
  },
};
