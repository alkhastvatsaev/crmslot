"use client";

import dynamic from "next/dynamic";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { resolveAdminMapPageMode } from "@/features/map/resolveAdminMapPageMode";

const mapLoading = () => (
  <div
    className="flex h-full min-h-[240px] items-center justify-center bg-slate-50 text-sm text-slate-500"
    data-testid="map-page-loading"
    aria-busy="true"
  />
);

const MapboxView = dynamic(() => import("@/features/map/components/MapboxView"), {
  ssr: false,
  loading: mapLoading,
});

const MobileMapHubLite = dynamic(() => import("@/features/map/components/MobileMapHubLite"), {
  ssr: false,
  loading: mapLoading,
});

/** Page carte admin — lite mobile par défaut ; Mapbox si `mobileMapWebGL`. */
export default function MapPageSlot() {
  const isMobile = useIsMobile();
  const mobileMapWebGL = useFeatureFlag("mobileMapWebGL");
  const mode = resolveAdminMapPageMode(isMobile, mobileMapWebGL);

  return <>{mode === "lite" ? <MobileMapHubLite /> : <MapboxView />}</>;
}
