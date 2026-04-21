'use client';

import { SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import AssociateAgencyAvailability from '@/components/associate-agency-availability';
import { AssociateAgencyBlockingScreen } from '@/components/onboarding/AssociateAgencyBlockingScreen';
import { AssociateAgencyClientForm } from '@/components/onboarding/AssociateAgencyClientForm';
import { AssociateAgencyFlowHeader } from '@/components/onboarding/AssociateAgencyFlowHeader';
import { AssociateAgencyModeSelection } from '@/components/onboarding/AssociateAgencyModeSelection';
import { AssociateAgencyTrainerAddressForm } from '@/components/onboarding/AssociateAgencyTrainerAddressForm';
import GooglePlacesScript from '@/components/shared/GooglePlacesScript';
import {
  useAssociateAgencyPageState,
  type AssociateAgencySuccessData,
} from '@/lib/client/hooks/useAssociateAgencyPageState';

type Props = {
  onSuccess?: (data: AssociateAgencySuccessData) => void;
  className?: string;
};

function AssociateAgencyContent({ onSuccess, className }: Props) {
  const logo = '/NouveauLogoRogne2.png';
  const {
    addressInput,
    addressInputRef,
    blockingMessage,
    canContinueTrainerAddress,
    canSubmitClient,
    code,
    displayName,
    email,
    error,
    greetingNode,
    handleAddressInputChange,
    handleBackToTrainerAddress,
    handleContinueTrainerAddress,
    handleMapsLoadError,
    handleMapsReady,
    handleSelectClientMode,
    handleSelectTrainerMode,
    handleSubmitClient,
    handleTrainerOnboarded,
    isUserLoaded,
    locale,
    loading,
    mode,
    redirectUrl,
    resetAll,
    selectedAddress,
    setCode,
    setTrainerAgencyName,
    setTrainerWebsiteUrl,
    showBlockingScreen,
    trainerAgencyName,
    trainerStep,
    trainerWebsiteUrl,
    t,
  } = useAssociateAgencyPageState({ onSuccess });

  if (showBlockingScreen) {
    return (
      <AssociateAgencyBlockingScreen
        blockingMessage={blockingMessage}
        locale={locale}
        logo={logo}
      />
    );
  }

  return (
    <div className="bg-[#f9ffc6]/80 min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-black/10 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-8 md:py-3">
          <Link
            href={`/${locale}/home`}
            className="flex items-center gap-2 min-w-0"
          >
            <span className="relative h-7 w-7 shrink-0 md:h-8 md:w-8">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="32px"
                className="object-contain"
                priority
              />
            </span>
            <span className="truncate text-sm md:text-base font-semibold tracking-tight">
              MagicHango
            </span>
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <SignOutButton signOutOptions={{ redirectUrl }}>
              <button
                type="button"
                className="text-[11px] md:text-sm font-medium text-white/80 hover:text-white transition"
              >
                {locale.startsWith('fr') ? 'Déconnexion' : 'Sign out'}
              </button>
            </SignOutButton>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-14 md:pt-16">
        <GooglePlacesScript
          onReady={handleMapsReady}
          onLoadError={handleMapsLoadError}
        />

        {mode === null ? (
          <AssociateAgencyModeSelection
            displayName={displayName}
            isUserLoaded={isUserLoaded}
            locale={locale}
            onSelectClient={handleSelectClientMode}
            onSelectTrainer={handleSelectTrainerMode}
          />
        ) : (
          <div
            className={[
              'mx-auto px-4 py-10',
              mode === 'trainer' && trainerStep === 'availability'
                ? 'max-w-6xl'
                : 'max-w-2xl',
            ].join(' ')}
          >
            <AssociateAgencyFlowHeader
              displayName={displayName}
              email={email}
              greetingNode={greetingNode}
              isUserLoaded={isUserLoaded}
              locale={locale}
              onReset={resetAll}
            />

            {mode === 'client' ? (
              <AssociateAgencyClientForm
                addressInput={addressInput}
                canSubmit={canSubmitClient}
                className={className}
                code={code}
                error={error}
                inputRef={addressInputRef}
                loading={loading}
                onAddressChange={handleAddressInputChange}
                onCodeChange={setCode}
                onSubmit={handleSubmitClient}
                t={
                  t as unknown as (
                    path: string,
                    vars?: Record<string, string | number | null | undefined>,
                  ) => string
                }
              />
            ) : null}

            {mode === 'trainer' ? (
              <>
                {trainerStep === 'address' ? (
                  <AssociateAgencyTrainerAddressForm
                    addressInput={addressInput}
                    canContinue={canContinueTrainerAddress}
                    className={className}
                    error={error}
                    inputRef={addressInputRef}
                    locale={locale}
                    onAddressChange={handleAddressInputChange}
                    onAgencyNameChange={setTrainerAgencyName}
                    onContinue={handleContinueTrainerAddress}
                    onWebsiteChange={setTrainerWebsiteUrl}
                    trainerAgencyName={trainerAgencyName}
                    trainerWebsiteUrl={trainerWebsiteUrl}
                  />
                ) : (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        type="button"
                        onClick={handleBackToTrainerAddress}
                        className="text-sm text-black/60 hover:text-black underline underline-offset-4"
                      >
                        {locale.startsWith('fr')
                          ? '<- Modifier les infos'
                          : '<- Edit info'}
                      </button>
                    </div>

                    <AssociateAgencyAvailability
                      onboarding={
                        selectedAddress
                          ? {
                              address: selectedAddress,
                              rawInput: addressInput,
                              agencyName: trainerAgencyName.trim(),
                              websiteUrl: trainerWebsiteUrl.trim(),
                            }
                          : null
                      }
                      onOnboarded={handleTrainerOnboarded}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AssociateAgencyPage() {
  return <AssociateAgencyContent />;
}
