'use client';

import { useLocale } from 'next-intl';

import { ProfileAddressCard } from '@/components/profile/ProfileAddressCard';
import { ProfileAddressModal } from '@/components/profile/ProfileAddressModal';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { ProfileNameModal } from '@/components/profile/ProfileNameModal';
import GooglePlacesScript from '@/components/shared/GooglePlacesScript';
import { useProfilePageState } from '@/lib/client/hooks/useProfilePageState';

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(value)
  );
}

export default function ProfilePage() {
  const locale = useLocale();
  const {
    addressError,
    addressModalOpen,
    closeAddressModal,
    closeNameModal,
    copied,
    copyJoinCode,
    deleteError,
    deleting,
    displayedMapAddress,
    draftAddress,
    draftName,
    error,
    formattedAddressRef,
    handleAddressDraftChange,
    handleDeleteAccount,
    handleSaveAddress,
    handleSaveName,
    isMapsReady,
    loadProfile,
    loading,
    nameError,
    nameModalOpen,
    onMapsLoadError,
    onMapsReady,
    openAddressModal,
    openNameModal,
    profile,
    savingAddress,
    savingName,
    selectedAddress,
    setDraftName,
    t,
    translator,
    successMessage,
  } = useProfilePageState();

  const googleScript = (
    <GooglePlacesScript
      onReady={onMapsReady}
      onLoadError={onMapsLoadError}
    />
  );

  if (loading) {
    return (
      <>
        {googleScript}
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-3xl rounded-xl border bg-card p-6 shadow-sm animate-pulse space-y-4">
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
              <div className="h-16 rounded-lg bg-muted" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        {googleScript}
        <main className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-sm space-y-4 text-center">
            <p className="text-sm text-red-600">{t('errors.loadProfile')}</p>
            <button
              onClick={() => {
                void loadProfile();
              }}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t('common.retry')}
            </button>
          </div>
        </main>
      </>
    );
  }

  const initials =
    profile.name
      ?.trim()
      ?.split(' ')
      ?.map((part) => part[0])
      ?.join('')
      ?.toUpperCase() || profile.id.slice(0, 2).toUpperCase();

  return (
    <>
      {googleScript}

      <main className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-5xl space-y-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.4fr)]">
            <div className="space-y-6">
              <ProfileIdentityCard
                copied={copied}
                createdOnLabel={formatDate(profile.createdAt, locale)}
                initials={initials}
                onCopyJoinCode={copyJoinCode}
                onEditName={openNameModal}
                profile={profile}
                t={translator}
              />

              {error ? (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {successMessage ? (
                <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs md:text-sm text-emerald-700">
                  {successMessage}
                </div>
              ) : null}
              {deleteError ? (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs md:text-sm text-red-700">
                  {deleteError}
                </div>
              ) : null}

              <section className="rounded-2xl border p-4 md:p-5 space-y-3">
                <h2 className="text-sm font-semibold">{t('delete.title')}</h2>
                <p className="text-xs">{t('delete.body')}</p>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleting ? t('delete.inProgress') : t('delete.button')}
                </button>
              </section>
            </div>

            <div className="space-y-6">
              <ProfileAddressCard
                address={displayedMapAddress}
                isMapsReady={isMapsReady}
                onEditAddress={openAddressModal}
                profile={profile}
                t={translator}
              />
            </div>
          </div>
        </div>

        <ProfileNameModal
          draftName={draftName}
          error={nameError}
          onChange={setDraftName}
          onClose={closeNameModal}
          onSubmit={handleSaveName}
          open={nameModalOpen}
          saving={savingName}
          t={translator}
        />

        <ProfileAddressModal
          addressError={addressError}
          draftAddress={draftAddress}
          formattedAddressRef={formattedAddressRef}
          onChange={handleAddressDraftChange}
          onClose={closeAddressModal}
          onSubmit={handleSaveAddress}
          open={addressModalOpen}
          saving={savingAddress}
          selectedAddress={selectedAddress}
          t={translator}
        />
      </main>
    </>
  );
}
