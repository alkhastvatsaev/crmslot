import { resolveMobileAccessAllowed } from "@/core/config/resolveMobileAccessAllowed";

/** Build-time — aligné sur `resolveMobileAccessAllowed` (prod = ouvert par défaut). */
export const mobileAccessAllowed = resolveMobileAccessAllowed();
