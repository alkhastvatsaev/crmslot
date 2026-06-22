"use client";

import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

/** Mode urgence mobile (deadline) — un seul hub, pas de push/dispatch lourd. */
export function useMobileEmergencyLite(): boolean {
  const isMobile = useIsMobile();
  const emergency = useFeatureFlag("mobileEmergencyLite");
  return isMobile === true && emergency;
}
