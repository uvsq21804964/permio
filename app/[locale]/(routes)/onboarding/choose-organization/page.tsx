'use client';

import { Suspense } from 'react';
import { SignOutButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

import { LocaleSwitcher } from '@/app/[locale]/_components/LocaleSwitcher';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
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

const LOGO_PATH = '/NouveauLogoRogne2.png';

function AssociateAgencyPageFallback() {
  return (
    <AssociateAgencyBlockingScreen
      blockingMessage={null}
      locale="en"
      logo={LOGO_PATH}
    />
  );
}

function AssociateAgencyContent({ onSuccess, className }: Props) {
  const logo = LOGO_PATH;
  const {
    addressInput,
    agencyPreview,
    agencyPreviewLoading,
    addressInputRef,
    blockingMessage,
    canContinueTrainerAddress,
    canSubmitClient,
    code,
    clientInviteAgencyName,
    clientInviteLocked,
    displayName,
    email,
    error,
    greetingNode,
    handleAddressInputChange,
    handleBackToTrainerAddress,
    handleContinueTrainerAddress,
    handleExitClientInviteFlow,
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
    setTrainerPhoneCountryCode,
    setTrainerPhoneNumber,
    setTrainerWebsiteUrl,
    showBlockingScreen,
    trainerAgencyName,
    trainerPhoneCountryCode,
    trainerPhoneNumber,
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
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-[#f9ffc6]/80 bg-gradient-to-r from-primary to-[#d400ff] text-white">
        <div className="mx-auto flex h-10 max-w-6xl items-stretch justify-between px-4 md:h-12 md:px-8">
          <Link
            href={`/${locale}/home`}
            className="flex min-w-0 items-end gap-2"
          >
            <span className="relative h-full w-14 shrink-0 md:w-16">
              <Image
                src={logo}
                alt="MagicHango"
                fill
                sizes="64px"
                className="object-contain object-bottom"
                priority
              />
            </span>
            <BrandWordmark />
          </Link>

          <nav className="flex items-center gap-2 md:gap-3">
            <SignOutButton signOutOptions={{ redirectUrl }}>
              <button
                type="button"
                className="inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white hover:text-primary whitespace-nowrap md:text-sm"
              >
                {locale.startsWith('fr') ? 'Déconnexion' : 'Sign out'}
              </button>
            </SignOutButton>
            <LocaleSwitcher />
          </nav>
        </div>
      </header>

      <main className="pt-[calc(4rem+env(safe-area-inset-top))] md:pt-16">
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
              clientInviteLocked={clientInviteLocked && mode === 'client'}
              displayName={displayName}
              email={email}
              greetingNode={greetingNode}
              isUserLoaded={isUserLoaded}
              locale={locale}
              onReset={
                clientInviteLocked && mode === 'client'
                  ? handleExitClientInviteFlow
                  : resetAll
              }
            />

            {mode === 'client' ? (
              <AssociateAgencyClientForm
                agencyName={clientInviteAgencyName}
                agencyPreview={agencyPreview}
                agencyPreviewLoading={agencyPreviewLoading}
                addressInput={addressInput}
                canSubmit={canSubmitClient}
                className={className}
                code={code}
                error={error}
                inputRef={addressInputRef}
                isAgencyCodeLocked={clientInviteLocked}
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
                    onPhoneCountryCodeChange={setTrainerPhoneCountryCode}
                    onPhoneNumberChange={setTrainerPhoneNumber}
                    onWebsiteChange={setTrainerWebsiteUrl}
                    trainerAgencyName={trainerAgencyName}
                    trainerPhoneCountryCode={trainerPhoneCountryCode}
                    trainerPhoneNumber={trainerPhoneNumber}
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
                              phoneCountryCode: trainerPhoneCountryCode.trim(),
                              phoneNumber: trainerPhoneNumber.trim(),
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
  return (
    <Suspense fallback={<AssociateAgencyPageFallback />}>
      <AssociateAgencyContent />
    </Suspense>
  );
}
