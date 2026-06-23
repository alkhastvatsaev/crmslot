"use client";

import TourOptimizeButton from "@/features/technicians/components/TourOptimizeButton";
import {
  DASHBOARD_DESKTOP_GALAXY_BOTTOM_CLASS,
  DASHBOARD_DESKTOP_GALAXY_INSET_END_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import type { Intervention } from "@/features/interventions";

type Props = {
  onRecenter: () => void;
  visibleInterventions: Intervention[];
  onRouteOptimized: (ordered: Intervention[]) => void;
  layout: "mobile" | "desktop";
};

export default function MapboxMapControls({
  onRecenter,
  visibleInterventions,
  onRouteOptimized,
  layout,
}: Props) {
  if (layout === "mobile") {
    return (
      <div
        className="absolute z-[1] flex flex-col gap-2"
        style={{ bottom: "calc(env(safe-area-inset-bottom,0px) + 16px)", right: "16px" }}
      >
        <RecenterButton
          onRecenter={onRecenter}
          className="h-10 w-10 rounded-[12px] opacity-90 hover:opacity-100"
        />
        {visibleInterventions.length >= 2 ? (
          <TourOptimizeButton
            missions={visibleInterventions}
            onOptimized={onRouteOptimized}
            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/75 bg-white/95 opacity-90 shadow-md backdrop-blur-xl transition-all duration-300 hover:opacity-100"
          />
        ) : null}
      </div>
    );
  }

  return (
    <button
      onClick={onRecenter}
      className={`group absolute z-[1] flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-[14px] border border-white/75 bg-white/95 opacity-80 shadow-[0_8px_30px_rgba(0,0,0,0.076),0_2px_10px_rgba(0,0,0,0.038)] backdrop-blur-2xl backdrop-saturate-[180%] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:opacity-100 hover:shadow-[0_12px_40px_rgba(0,0,0,0.11)] active:translate-y-0 active:scale-95 ${DASHBOARD_DESKTOP_GALAXY_BOTTOM_CLASS} ${DASHBOARD_DESKTOP_GALAXY_INSET_END_CLASS}`}
      title="Recentrer la carte"
      type="button"
    >
      <svg
        className="h-5 w-5 text-slate-600 transition-colors group-hover:text-slate-900"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
    </button>
  );
}

function RecenterButton({ onRecenter, className }: { onRecenter: () => void; className: string }) {
  return (
    <button
      onClick={onRecenter}
      className={`group flex cursor-pointer items-center justify-center border border-white/75 bg-white/95 shadow-md backdrop-blur-xl transition-all duration-300 ${className}`}
      title="Recentrer la carte"
      type="button"
    >
      <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
    </button>
  );
}
