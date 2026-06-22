"use client";

import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";

/** Mode urgence mobile — **iPhone seulement** (Android garde l’expérience complète). */
export function useMobileEmergencyLite(): boolean {
  const isMobile = useIsMobile();
  const emergency = useFeatureFlag("mobileEmergencyLite");
  if (typeof navigator !== "undefined" && !isIosPhonePowerSave()) {
    return false;
  }
  return isMobile === true && emergency;
}
