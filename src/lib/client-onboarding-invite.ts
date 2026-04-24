type SearchParamValue = string | string[] | undefined | null;

export type ClientOnboardingInvite = {
  agencyCode: string;
  agencyName: string | null;
  isClientInvite: boolean;
};

function firstValue(value: SearchParamValue) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }

  return typeof value === 'string' ? value : '';
}

function normalizeAgencyCode(value: string) {
  return value.trim().toUpperCase();
}

function normalizeAgencyName(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeMode(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed === 'client' ? 'client' : null;
}

export function parseClientOnboardingInvite(values: {
  agencyCode?: SearchParamValue;
  code?: SearchParamValue;
  agencyName?: SearchParamValue;
  mode?: SearchParamValue;
  role?: SearchParamValue;
}): ClientOnboardingInvite {
  const mode =
    normalizeMode(firstValue(values.mode)) ??
    normalizeMode(firstValue(values.role));
  const agencyCode = normalizeAgencyCode(
    firstValue(values.agencyCode) || firstValue(values.code),
  );
  const agencyName = normalizeAgencyName(firstValue(values.agencyName));

  return {
    agencyCode,
    agencyName,
    isClientInvite: mode === 'client' && agencyCode.length > 0,
  };
}

export function parseClientOnboardingInviteFromSearchParams(
  searchParams: Pick<URLSearchParams, 'get'> | null | undefined,
): ClientOnboardingInvite {
  return parseClientOnboardingInvite({
    agencyCode: searchParams?.get('agencyCode'),
    code: searchParams?.get('code'),
    agencyName: searchParams?.get('agencyName'),
    mode: searchParams?.get('mode'),
    role: searchParams?.get('role'),
  });
}

export function appendClientOnboardingInvite(
  path: string,
  invite: ClientOnboardingInvite,
) {
  if (!invite.isClientInvite) {
    return path;
  }

  const [pathname, existingQuery = ''] = path.split('?');
  const params = new URLSearchParams(existingQuery);
  params.set('mode', 'client');
  params.set('agencyCode', invite.agencyCode);

  if (invite.agencyName) {
    params.set('agencyName', invite.agencyName);
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
