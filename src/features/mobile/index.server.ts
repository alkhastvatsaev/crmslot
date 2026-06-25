/**
 * API serveur mobile — config build + registry PWA (routes API uniquement).
 */
export type { MobileRuntimeConfig } from "@/features/mobile/server/mobileRuntimeConfig";
export {
  buildMobileRuntimeConfig,
  isMobileAccessAllowedAtBuild,
} from "@/features/mobile/server/mobileRuntimeConfig";
export type {
  PwaRegistryPayload,
  PwaRegistryFirestore,
} from "@/features/mobile/server/companyPwaRegistryAdmin";
export {
  serializePwaRegistryTimestamp,
  buildCompanyPwaRegistry,
  loadCompanyPwaRegistryAdmin,
} from "@/features/mobile/server/companyPwaRegistryAdmin";
