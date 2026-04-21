export type NavPage = {
  nameFR: string;
  nameEN: string;
  link: string;
  visible: number;
  cta?: boolean;
};

export type NavbarRole = 'student' | 'instructor' | 'admin' | string | null;

export const PROFILE_LINKS = new Set([
  '/services',
  '/availability',
  '/invoices',
  '/plans',
  '/profile',
  '/sign-out',
  '/gestion',
]);

export function withLocalePath(path: string, locale: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.startsWith(`/${locale}/`)
    ? normalizedPath
    : `/${locale}${normalizedPath}`;
}

export function stripLocalePrefix(path: string, locale: string) {
  const normalizedPath = path || '';
  const prefix = `/${locale}`;

  if (normalizedPath === prefix) return '/';
  if (normalizedPath.startsWith(`${prefix}/`)) {
    return normalizedPath.slice(prefix.length);
  }

  return normalizedPath;
}

export function filterNavbarPages(
  pages: NavPage[],
  role: NavbarRole,
): NavPage[] {
  return pages.filter((page) => {
    if (role === 'instructor') {
      return page.visible === 0 || page.visible === 2;
    }

    if (role === 'student') {
      return page.visible === 1 || page.visible === 2;
    }

    if (role === 'admin') {
      return true;
    }

    return page.visible === 2;
  });
}
