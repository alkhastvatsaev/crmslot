"use client";

import dynamic from "next/dynamic";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";

const MapboxView = dynamic(() => import("@/features/map/components/MapboxView"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[240px] items-center justify-center bg-slate-50 text-sm text-slate-500"
      data-testid="map-page-loading"
      aria-busy="true"
    />
  ),
});

const MobileMapHubLite = dynamic(() => import("@/features/map/components/MobileMapHubLite"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full min-h-[240px] items-center justify-center bg-slate-50 text-sm text-slate-500"
      data-testid="map-page-loading"
      aria-busy="true"
    />
  ),
});

/**
 * Page carte admin — mobile sans WebGL par défaut (flag `mobileMapWebGL` = mode ultra).
 */
export default function MapPageSlot() {
  const isMobile = useIsMobile();
  const mobileMapWebGL = useFeatureFlag("mobileMapWebGL");

  if (isMobile === true && !mobileMapWebGL) {
    return <MobileMapHubLite />;
  }

  return <MapboxView />;
}
