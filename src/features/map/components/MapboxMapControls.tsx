"use client";

import {
  DASHBOARD_DESKTOP_GALAXY_BOTTOM_CLASS,
  DASHBOARD_DESKTOP_GALAXY_INSET_END_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import { MOBILE_MAP_RECENTER_BTN_CLASS } from "@/core/ui/dashboardMobileLayout";

type Props = {
  onRecenter: () => void;
  layout: "mobile" | "desktop";
};

export default function MapboxMapControls({ onRecenter, layout }: Props) {
  if (layout === "mobile") {
    return (
      <RecenterButton
        onRecenter={onRecenter}
        className={`${MOBILE_MAP_RECENTER_BTN_CLASS} h-10 w-10 rounded-[12px] opacity-90 hover:opacity-100`}
      />
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
