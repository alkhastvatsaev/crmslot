/** Route Capacitor app terrain (shell allégée une page). */
export const TECHNICIAN_MOBILE_APP_ROUTE = "/m/technician";

/** Index unique dans la shell terrain (pas le carrousel admin). */
export const TECHNICIAN_MOBILE_APP_SLOT_INDEX = 0;

export function isTechnicianMobileAppPath(pathname: string): boolean {
  return (
    pathname === TECHNICIAN_MOBILE_APP_ROUTE ||
    pathname.startsWith(`${TECHNICIAN_MOBILE_APP_ROUTE}/`)
  );
}
