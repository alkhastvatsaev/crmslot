"use client";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";

import { useTranslation } from "@/core/i18n/I18nContext";
import {
  DASHBOARD_CAROUSEL_PAGES,
  clampDashboardCarouselPageIndex,
  stepDashboardCarouselNavIndex,
} from "@/features/dashboard/dashboardCarouselRegistry";
import {
  dashboardHeaderPanelShellClass,
  DASHBOARD_PANEL_SHADOW_HOVER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";

/** 1 entrée par page carrousel — voir `dashboardCarouselRegistry.ts`. */
export const appProfiles = DASHBOARD_CAROUSEL_PAGES.map((page) => ({
  name: page.profileName,
  roleKey: page.profileRoleKey,
}));

export default function UserProfile() {
  const { t } = useTranslation();
  const pager = useDashboardPagerOptional();
  const profiles = appProfiles;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Synchronise le profil avec la page courante (1 profil par page carrousel).
  useEffect(() => {
    if (!pager) return;
    const index = clampDashboardCarouselPageIndex(pager.pageIndex, pager.pageCount);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex(index);
  }, [pager, pager?.pageIndex, pager?.pageCount]);

  const safeIndex = currentIndex >= 0 && currentIndex < profiles.length ? currentIndex : 0;
  const currentProfile = profiles[safeIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = stepDashboardCarouselNavIndex(currentIndex, "next");
    setCurrentIndex(newIndex);
    pager?.setPageIndex(newIndex);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = stepDashboardCarouselNavIndex(currentIndex, "prev");
    setCurrentIndex(newIndex);
    pager?.setPageIndex(newIndex);
  };

  return (
    <div
      className={`${dashboardHeaderPanelShellClass} ${DASHBOARD_PANEL_SHADOW_HOVER_CLASS} cursor-pointer items-center justify-center bg-white/70 ease-out hover:scale-[1.01] hover:bg-white/80 active:scale-[0.99]`}
    >
      <div className="flex items-center justify-between w-full px-4">
        <button
          onClick={handlePrev}
          data-testid="prev-profile-btn"
          className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700 flex-shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-4 flex-1">
          <span
            data-testid="profile-name"
            className="text-[20px] font-semibold text-slate-800 tracking-wide whitespace-nowrap"
          >
            {currentProfile.name}
          </span>
          <span
            data-testid="profile-role"
            className="px-2 py-1 rounded-md bg-[#E5F1FF] text-[#007AFF] text-[10px] font-extrabold uppercase tracking-widest border border-[#CCE3FF] shadow-sm whitespace-nowrap"
          >
            {t(`profiles.roles.${currentProfile.roleKey}`)}
          </span>
        </div>

        <button
          onClick={handleNext}
          data-testid="next-profile-btn"
          className="p-2 hover:bg-black/5 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-700 flex-shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
