type AssociateAgencyModeSelectionProps = {
  displayName: string;
  isUserLoaded: boolean;
  locale: string;
  onSelectClient: () => void;
  onSelectTrainer: () => void;
};

export function AssociateAgencyModeSelection({
  displayName,
  isUserLoaded,
  locale,
  onSelectClient,
  onSelectTrainer,
}: AssociateAgencyModeSelectionProps) {
  return (
    <div className="min-h-[calc(100vh-56px)] md:min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-black">
          {isUserLoaded && displayName ? (
            <>
              {locale.startsWith('fr') ? 'Bienvenue ' : 'Welcome '}
              <span className="text-primary">{displayName}</span>
            </>
          ) : locale.startsWith('fr') ? (
            'Bienvenue'
          ) : (
            'Welcome'
          )}
        </h1>

        <p className="mt-2 text-black/70">
          {locale.startsWith('fr')
            ? 'Que souhaitez-vous faire ?'
            : 'What would you like to do?'}
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onSelectClient}
            className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm md:text-base font-semibold bg-primary text-white shadow-sm border border-primary hover:bg-white hover:text-primary transition whitespace-nowrap"
          >
            {locale.startsWith('fr')
              ? 'Je veux reserver pour mon animal'
              : 'I want to book for my pet'}
          </button>

          <button
            type="button"
            onClick={onSelectTrainer}
            className="inline-flex items-center justify-center rounded-full border border-primary bg-white/95 px-5 py-2.5 text-sm md:text-base font-semibold text-primary shadow-sm hover:bg-primary hover:text-white transition whitespace-nowrap"
          >
            {locale.startsWith('fr')
              ? 'Je suis toiletteur canin'
              : "I'm a dog groomer"}
          </button>
        </div>
      </div>
    </div>
  );
}
