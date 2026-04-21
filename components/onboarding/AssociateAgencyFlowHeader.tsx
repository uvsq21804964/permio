import type { ReactNode } from 'react';

type AssociateAgencyFlowHeaderProps = {
  displayName: string;
  email: string;
  greetingNode: ReactNode;
  isUserLoaded: boolean;
  locale: string;
  onReset: () => void;
};

export function AssociateAgencyFlowHeader({
  displayName,
  email,
  greetingNode,
  isUserLoaded,
  locale,
  onReset,
}: AssociateAgencyFlowHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="text-lg md:text-xl font-bold text-black">{greetingNode}</div>

        {isUserLoaded && (displayName || email) ? (
          <div className="text-sm text-black/55 truncate">
            {[displayName, email].filter(Boolean).join(' · ')}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="ml-1 text-sm text-black/60 hover:text-black underline underline-offset-4 whitespace-nowrap"
        >
          {locale.startsWith('fr')
            ? 'Retour au choix des rôles'
            : 'Back to role selection'}
        </button>
      </div>
    </div>
  );
}
