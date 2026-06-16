import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
import { COMPANY_HUB_PAGE_INDEX } from "@/features/company/companyHubConstants";
import {
  CLIENT_MOBILE_APP_ROUTE,
  isClientMobileAppPath,
} from "@/features/company/clientMobileAppConstants";

/** Ancres pour défiler dans le portail client. */
export const COMPANY_HUB_ANCHOR_SMART_FORM = "company-hub-smart-form";
export const COMPANY_HUB_ANCHOR_WORKSPACE = "company-hub-workspace";
export const COMPANY_HUB_ANCHOR_CLIENT_PORTAL = "company-hub-client-portal";

function scrollCompanyHubAnchor(anchor: string, afterPageSwitch: boolean): void {
  if (typeof document === "undefined") return;
  const run = () =>
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
  if (afterPageSwitch) {
    window.setTimeout(run, 520);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(run));
  }
}

function redirectToClientMobileApp(anchor?: string): void {
  if (typeof window === "undefined") return;
  const hash = anchor ? `#${anchor}` : "";
  window.location.assign(`${CLIENT_MOBILE_APP_ROUTE}${hash}`);
}

export function resolveCompanyHubPageIndex(pathname?: string): number {
  if (pathname && isClientMobileAppPath(pathname)) return COMPANY_HUB_PAGE_INDEX;
  return COMPANY_HUB_PAGE_INDEX;
}

export function navigateCompanyHub(
  pager: DashboardPagerApi | null | undefined,
  anchor?: string,
  options?: { pathname?: string }
): void {
  const pathname =
    options?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : CLIENT_MOBILE_APP_ROUTE);

  if (!isClientMobileAppPath(pathname)) {
    redirectToClientMobileApp(anchor);
    return;
  }

  if (!pager) {
    if (anchor) scrollCompanyHubAnchor(anchor, false);
    return;
  }

  const wasOnHub = pager.pageIndex === COMPANY_HUB_PAGE_INDEX;
  pager.setPageIndex(COMPANY_HUB_PAGE_INDEX);
  if (!anchor) return;
  scrollCompanyHubAnchor(anchor, !wasOnHub);
}
