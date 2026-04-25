import Image from 'next/image';

import type { ProfileTranslator } from '@/components/profile/profile-shared';

type IdentityProfile = {
  agencyId: string | null;
  createdAt: string;
  id: string;
  joinCode?: string | null;
  name: string | null;
  phone_country_code?: string | null;
  phone_number?: string | null;
  role: string;
};

type ProfileIdentityCardProps = {
  copied: boolean;
  createdOnLabel: string;
  initials: string;
  onCopyJoinCode: () => void;
  onEditPhoto: () => void;
  onEditName: () => void;
  onEditPhone: () => void;
  profileImageUrl: string | null;
  profile: IdentityProfile;
  t: ProfileTranslator;
};

export function ProfileIdentityCard({
  copied,
  createdOnLabel,
  initials,
  onCopyJoinCode,
  onEditPhoto,
  onEditName,
  onEditPhone,
  profileImageUrl,
  profile,
  t,
}: ProfileIdentityCardProps) {
  const phoneValue = [profile.phone_country_code, profile.phone_number]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <>
      <section className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onEditPhoto}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-primary/10 text-primary transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={t('identity.avatar.edit')}
            title={t('identity.avatar.edit')}
          >
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt={t('identity.avatar.alt', {
                  name: profile.name || t('common.user'),
                })}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span className="text-lg font-semibold">{initials}</span>
            )}

            <span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-medium text-white opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
              {t('identity.avatar.edit')}
            </span>
          </button>

          <div className="space-y-1">
            <h1 className="text-lg md:text-xl font-semibold">{t('header.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('header.connectedAs')}{' '}
              <span className="font-medium">{profile.name || t('common.user')}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {t('header.createdOn', { date: createdOnLabel })}
            </p>
            <button
              type="button"
              onClick={onEditPhoto}
              className="text-xs font-medium text-primary hover:underline"
            >
              {t('identity.avatar.help')}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">{t('identity.title')}</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-foreground">
              {t('identity.displayName.label')}
            </span>

            <div className="flex items-center gap-2">
              <p className="flex-1 border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground font-mono">
                {profile.name || t('identity.displayName.empty')}
              </p>
              <button
                type="button"
                onClick={onEditName}
                className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-[11px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {t('identity.displayName.edit')}
              </button>
            </div>
          </div>

          {profile.role === 'instructor' ? (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                {t('identity.educatorCode.label')}
              </span>

              <div className="flex items-center gap-2">
                <p className="flex-1 border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground font-mono">
                  {profile.joinCode || '—'}
                </p>

                <button
                  type="button"
                  onClick={onCopyJoinCode}
                  disabled={!profile.joinCode}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-[11px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                  title={t('identity.educatorCode.copyTitle')}
                >
                  {copied
                    ? t('identity.educatorCode.copied')
                    : t('identity.educatorCode.copy')}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {t('identity.educatorCode.help')}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                {t('identity.role')}
              </span>
              <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                {profile.role}
              </p>
            </div>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                {t('identity.agency')}
              </span>
              <p className="border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                {profile.agencyId}
              </p>
            </div>
          </div>

          {profile.role === 'instructor' ? (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-foreground">
                {t('identity.phone.label')}
              </span>

              <div className="flex items-center gap-2">
                <p className="flex-1 border rounded-md px-3 py-2 bg-muted/40 text-muted-foreground">
                  {phoneValue || t('identity.phone.empty')}
                </p>
                <button
                  type="button"
                  onClick={onEditPhone}
                  className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-[11px] font-medium text-primary hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {t('identity.phone.edit')}
                </button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {t('identity.phone.help')}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
