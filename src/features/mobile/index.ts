/**
 * API publique mobile — config runtime PWA + DesktopOnlyGate policy.
 */
export type { MobileRuntimeConfigResponse } from "@/features/mobile/fetchMobileRuntimeConfig";
export {
  fetchMobileRuntimeConfig,
  fetchCompanyPwaRegistry,
} from "@/features/mobile/fetchMobileRuntimeConfig";
export type { MobileRuntimeConfig } from "@/features/mobile/server/mobileRuntimeConfig";
export {
  buildMobileRuntimeConfig,
  isMobileAccessAllowedAtBuild,
} from "@/features/mobile/server/mobileRuntimeConfig";
export {
  shouldBypassDesktopOnlyGate,
  shouldBlockPhoneOnDesktopOnlyGate,
  resolveRuntimeMobileAccessAllowed,
} from "@/features/mobile/server/desktopOnlyGatePolicy";
export type {
  PwaRegistryPayload,
  PwaRegistryFirestore,
} from "@/features/mobile/server/companyPwaRegistryAdmin";
export {
  serializePwaRegistryTimestamp,
  buildCompanyPwaRegistry,
  loadCompanyPwaRegistryAdmin,
} from "@/features/mobile/server/companyPwaRegistryAdmin";
