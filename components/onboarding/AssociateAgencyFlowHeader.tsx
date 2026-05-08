import type { ReactNode } from 'react';

type AssociateAgencyFlowHeaderProps = {
  clientInviteLocked?: boolean;
  displayName: string;
  email: string;
  greetingNode: ReactNode;
  isUserLoaded: boolean;
  locale: string;
  onReset: () => void;
};

export function AssociateAgencyFlowHeader({
  clientInviteLocked = false,
  displayName,
  email,
  greetingNode,
  isUserLoaded,
  locale,
  onReset,
}: AssociateAgencyFlowHeaderProps) {
  const isFrench = locale.startsWith('fr');
  const identity = [displayName, email].filter(Boolean).join(' · ');

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-3">
        <div className="max-w-xl text-2xl font-black leading-[1.02] tracking-[-0.05em] text-black md:text-[2rem]">
          {greetingNode}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-black/58">
          {isUserLoaded && identity ? (
            <span className="max-w-full truncate rounded-full bg-black/[0.045] px-3 py-1.5 text-black/62">
              {identity}
            </span>
          ) : null}

          <span className="text-black/50">
            {isFrench
              ? 'Quelques infos suffisent pour lancer la suite.'
              : 'A few details and we take care of the rest.'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm font-medium text-black/65 shadow-sm transition hover:border-black/15 hover:bg-white hover:text-black whitespace-nowrap"
      >
        {clientInviteLocked
          ? isFrench
            ? "Je suis toiletteur canin, pas client"
            : "I'm a dog groomer, not a client"
          : isFrench
            ? 'Retour au choix des rôles'
            : 'Back to role selection'}
      </button>
    </div>
  );
}
