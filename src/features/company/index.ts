/**
 * API publique company — portail demandeur, workspace multi-société et helpers hubs.
 * Route client → `/m/demande` (hors carrousel admin).
 */
export type { CompanyRole, CompanyMembershipRow } from "@/features/company/types";
export { resolveHubCompanyId } from "@/features/company/resolveHubCompanyId";
export type { HubCompanyPhase } from "@/features/company/resolveHubCompanyId";
export {
  COMPANY_HUB_PAGE_INDEX,
  COMPANY_HUB_CAROUSEL_HUMAN_INDEX,
  COMPANY_HUB_RAIL_DEMANDE_LABEL,
} from "@/features/company/companyHubConstants";
export {
  CLIENT_MOBILE_APP_ROUTE,
  CLIENT_MOBILE_APP_SLOT_INDEX,
  isClientMobileAppPath,
} from "@/features/company/clientMobileAppConstants";
export {
  COMPANY_HUB_ANCHOR_SMART_FORM,
  COMPANY_HUB_ANCHOR_WORKSPACE,
  COMPANY_HUB_ANCHOR_CLIENT_PORTAL,
  resolveCompanyHubPageIndex,
  navigateCompanyHub,
} from "@/features/company/companyHubNavigation";
export {
  readClientPortalDefaultCompanyIdFromEnv,
  resolveClientPortalInterventionCompanyId,
  resolvePortalChatCompanyId,
  resolveBackofficeInboxCompanyIds,
} from "@/features/company/clientPortalCompanyId";
export type { ResolveClientPortalInterventionCompanyIdInput } from "@/features/company/clientPortalCompanyId";
export { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";
export { isPortalInvoiceAvailable } from "@/features/company/portalInvoiceAvailability";
export { default as ClientMobileApp } from "@/features/company/components/ClientMobileApp";
