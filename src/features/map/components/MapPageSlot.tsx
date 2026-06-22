"use client";

import dynamic from "next/dynamic";

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

/** Page carte admin — Mapbox WebGL (mobile + desktop). */
export default function MapPageSlot() {
  return <MapboxView />;
}
