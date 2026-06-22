"use client";

import dynamic from "next/dynamic";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { isIosPhonePowerSave } from "@/core/perf/iosPhonePowerSave";

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
 * Page carte admin — lite sans WebGL sur **iPhone** (flag `mobileMapWebGL` = mode ultra).
 * Android : Mapbox normale.
 */
export default function MapPageSlot() {
  const isMobile = useIsMobile();
  const mobileMapWebGL = useFeatureFlag("mobileMapWebGL");

  if (isMobile === true && !mobileMapWebGL && isIosPhonePowerSave()) {
    return <MobileMapHubLite />;
  }

  return <MapboxView />;
}
