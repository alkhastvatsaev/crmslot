"use client";

import React, { useState, useEffect } from "react";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import { useTranslation } from "@/core/i18n/I18nContext";
import {
  DASHBOARD_CAROUSEL_PAGES,
  clampDashboardCarouselPageIndex,
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

type UserProfileProps = {
  /** Clic sur le profil → panneau compte dans le panneau central. */
  interactive?: boolean;
  variant?: "desktop" | "mobile";
};

function useProfileIndex() {
  const pager = useDashboardPagerOptional();
  const profiles = appProfiles;
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!pager) return;
    const index = clampDashboardCarouselPageIndex(pager.pageIndex, pager.pageCount);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentIndex(index);
  }, [pager, pager?.pageIndex, pager?.pageCount]);

  const safeIndex = currentIndex >= 0 && currentIndex < profiles.length ? currentIndex : 0;
  return profiles[safeIndex];
}

export default function UserProfile({
  interactive = false,
  variant = "desktop",
}: UserProfileProps) {
  if (!interactive) {
    return <UserProfileStatic variant={variant} />;
  }
  return <UserProfileInteractive variant={variant} />;
}

function UserProfileStatic({ variant }: { variant: "desktop" | "mobile" }) {
  const { t } = useTranslation();
  const currentProfile = useProfileIndex();
  return (
    <div
      data-testid="user-profile-static"
      className="mobile-header-chip mobile-profile-chip h-full w-full flex-row items-center justify-center gap-2 px-4"
    >
      <ProfileLabel variant={variant} currentProfile={currentProfile} t={t} />
    </div>
  );
}

function UserProfileInteractive({ variant }: { variant: "desktop" | "mobile" }) {
  const { t } = useTranslation();
  const pageSelector = useDashboardPageSelector();
  const currentProfile = useProfileIndex();
  const accountOpen = pageSelector.view === "account";

  const mobileClasses =
    "mobile-header-chip mobile-header-chip--interactive mobile-profile-chip h-full w-full flex-row items-center justify-center gap-2 px-4";
  const desktopClasses = `${dashboardHeaderPanelShellClass} ${DASHBOARD_PANEL_SHADOW_HOVER_CLASS} w-full cursor-pointer items-center justify-center bg-white/70 ease-out hover:scale-[1.01] hover:bg-white/80 active:scale-[0.99]`;

  return (
    <button
      type="button"
      data-testid="user-profile-toggle"
      className={variant === "mobile" ? mobileClasses : desktopClasses}
      aria-label="Ouvrir mon compte"
      aria-expanded={accountOpen}
      onClick={() => pageSelector.toggleAccount()}
    >
      <ProfileLabel variant={variant} currentProfile={currentProfile} t={t} />
    </button>
  );
}

function ProfileLabel({
  variant,
  currentProfile,
  t,
}: {
  variant: "desktop" | "mobile";
  currentProfile: (typeof appProfiles)[number];
  t: (key: string) => string;
}) {
  const profileLabel =
    variant === "mobile" ? (
      <div className="flex min-w-0 items-center gap-2">
        <span
          data-testid="profile-name"
          className="truncate text-sm font-semibold text-slate-800 tracking-wide"
        >
          {currentProfile.name}
        </span>
        <span
          data-testid="profile-role"
          className="shrink-0 rounded-md border border-[#CCE3FF] bg-[#E5F1FF] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-[#007AFF]"
        >
          {t(`profiles.roles.${currentProfile.roleKey}`)}
        </span>
      </div>
    ) : (
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <span
          data-testid="profile-name"
          className="text-base font-semibold text-slate-800 tracking-wide whitespace-nowrap sm:text-[20px]"
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
    );

  return profileLabel;
}
