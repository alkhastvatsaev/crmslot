import type { DashboardPagerApi } from "@/features/dashboard";
import {
  TECHNICIAN_MOBILE_APP_ROUTE,
  TECHNICIAN_MOBILE_APP_SLOT_INDEX,
  isTechnicianMobileAppPath,
} from "@/features/interventions/technicianMobileAppConstants";

/** Ancres pour défiler dans le hub technicien (app terrain). */
export const TECHNICIAN_HUB_ANCHOR_MISSIONS = "technician-hub-missions";
export const TECHNICIAN_HUB_ANCHOR_FINISH = "technician-hub-finish";
export const TECHNICIAN_HUB_ANCHOR_PUSH = "technician-hub-push";
export const TECHNICIAN_HUB_ANCHOR_INVOICE = "technician-hub-invoice";

export function resolveTechnicianHubPageIndex(pathname?: string): number {
  if (pathname && isTechnicianMobileAppPath(pathname)) return TECHNICIAN_MOBILE_APP_SLOT_INDEX;
  return TECHNICIAN_MOBILE_APP_SLOT_INDEX;
}

function scrollTechnicianHubAnchor(anchor: string, afterPageSwitch: boolean): void {
  if (typeof document === "undefined") return;
  const run = () =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (afterPageSwitch) {
    window.setTimeout(run, 520);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(run));
  }
}

function redirectToTechnicianMobileApp(anchor?: string): void {
  if (typeof window === "undefined") return;
  const hash = anchor ? `#${anchor}` : "";
  window.location.assign(`${TECHNICIAN_MOBILE_APP_ROUTE}${hash}`);
}

/**
 * Ouvre l’app terrain ; fait défiler vers une section si `anchor` est fourni.
 */
export function navigateTechnicianHub(
  pager: DashboardPagerApi | null | undefined,
  anchor?: string,
  options?: { pathname?: string }
): void {
  const pathname =
    options?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : TECHNICIAN_MOBILE_APP_ROUTE);

  if (!isTechnicianMobileAppPath(pathname)) {
    redirectToTechnicianMobileApp(anchor);
    return;
  }

  const hubPageIndex = resolveTechnicianHubPageIndex(pathname);

  if (!pager) {
    if (anchor) scrollTechnicianHubAnchor(anchor, false);
    return;
  }

  const wasOnHub = pager.pageIndex === hubPageIndex;
  pager.setPageIndex(hubPageIndex);
  if (!anchor) return;
  scrollTechnicianHubAnchor(anchor, !wasOnHub);
}
