import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";

export function isTechnicianAppPath(pathname = ""): boolean {
  return pathname.startsWith(TECHNICIAN_MOBILE_APP_ROUTE);
}

export function isClientAppPath(pathname = ""): boolean {
  return pathname.startsWith(CLIENT_MOBILE_APP_ROUTE);
}

export function redirectToTechnicianApp(query: URLSearchParams): void {
  if (typeof window === "undefined") return;
  const qs = query.toString();
  window.location.assign(`${TECHNICIAN_MOBILE_APP_ROUTE}${qs ? `?${qs}` : ""}`);
}

export function redirectToClientApp(query: URLSearchParams): void {
  if (typeof window === "undefined") return;
  const qs = query.toString();
  window.location.assign(`${CLIENT_MOBILE_APP_ROUTE}${qs ? `?${qs}` : ""}`);
}

export function currentAppPathname(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname;
}
