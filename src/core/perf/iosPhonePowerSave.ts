import { isIphoneUserAgent } from "@/core/config/mobileClientDetection";

/**
 * Profil perf/batterie strict — **iPhone / iPod uniquement**.
 * Android phone ne chauffe pas : on garde PWA, SW, carte, etc.
 */
export function isIosPhonePowerSave(
  userAgent: string = typeof navigator !== "undefined" ? navigator.userAgent : ""
): boolean {
  return isIphoneUserAgent(userAgent);
}
