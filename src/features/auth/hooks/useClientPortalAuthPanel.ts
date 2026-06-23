"use client";

import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { COMPANY_HUB_PAGE_INDEX } from "@/features/company/companyHubConstants";
import { isClientMobileAppPath } from "@/features/company/clientMobileAppConstants";
import { clientPortalAuth, isConfigured } from "@/core/config/firebase";
import {
  useClientPortalAuth,
  type ClientPortalAuthTab,
} from "@/features/auth/hooks/useClientPortalAuth";
import { useClientPortalSearch } from "@/features/auth/hooks/useClientPortalSearch";

export type UseClientPortalAuthPanelArgs = {
  authRailMode?: boolean;
  authTab?: ClientPortalAuthTab;
};

export function useClientPortalAuthPanel({
  authRailMode = false,
  authTab: authTabProp,
}: UseClientPortalAuthPanelArgs) {
  const pager = useDashboardPagerOptional();
  /** Carrousel : évite email+password dans le DOM hors page portail client (Safari Keychain). */
  const onClientPortalHub =
    typeof window !== "undefined" &&
    isClientMobileAppPath(window.location.pathname) &&
    pager != null &&
    pager.pageIndex === COMPANY_HUB_PAGE_INDEX;
  const mountCredentialFields = !authRailMode || pager == null || onClientPortalHub;

  const auth = useClientPortalAuth({ authRailMode, authTab: authTabProp });
  const search = useClientPortalSearch();

  return {
    authRailMode,
    mountCredentialFields,
    isOffline: !isConfigured || !clientPortalAuth,
    auth,
    search,
  };
}
