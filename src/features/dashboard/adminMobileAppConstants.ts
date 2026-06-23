/** Route PWA admin allégée (inbox + missions, hors carrousel 9 hubs). */
export const ADMIN_MOBILE_APP_ROUTE = "/m/admin";

/** Index unique dans la shell admin mobile. */
export const ADMIN_MOBILE_APP_SLOT_INDEX = 0;

export function isAdminMobileAppPath(pathname: string): boolean {
  return pathname === ADMIN_MOBILE_APP_ROUTE || pathname.startsWith(`${ADMIN_MOBILE_APP_ROUTE}/`);
}
