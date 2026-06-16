/** Route portail client (shell allégée une page). */
export const CLIENT_MOBILE_APP_ROUTE = "/m/demande";

/** Index unique dans la shell client (pas le carrousel admin). */
export const CLIENT_MOBILE_APP_SLOT_INDEX = 0;

export function isClientMobileAppPath(pathname: string): boolean {
  return pathname === CLIENT_MOBILE_APP_ROUTE || pathname.startsWith(`${CLIENT_MOBILE_APP_ROUTE}/`);
}
