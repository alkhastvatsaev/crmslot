"use client";

import { useEffect } from "react";
import { DASHBOARD_CAROUSEL_PAGES } from "@/features/dashboard/dashboardCarouselRegistry";
import { DASHBOARD_MOBILE_NAV_ICONS } from "@/features/dashboard/dashboardMobileNav";
import { useDashboardPager } from "@/features/dashboard/dashboardPagerContext";
import { useTranslation } from "@/core/i18n/I18nContext";

type Props = {
  open: boolean;
  onClose: () => void;
  profileName: string;
  profileRoleKey: string;
};

export default function MobileNavDrawer({ open, onClose, profileName, profileRoleKey }: Props) {
  const { pageIndex, setPageIndex } = useDashboardPager();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const navigate = (index: number) => {
    setPageIndex(index);
    onClose();
  };

  return (
    <>
      <div aria-hidden className="mobile-nav-drawer-backdrop" data-open={open} onClick={onClose} />

      <div
        role="dialog"
        aria-modal
        aria-label="Navigation"
        data-open={open}
        className="mobile-nav-drawer"
        data-testid="mobile-nav-drawer"
      >
        <div className="mobile-nav-drawer-handle" aria-hidden />

        {/* Profil en tête du drawer */}
        <div className="mobile-nav-drawer-profile">
          <div className="mobile-nav-drawer-avatar">{profileName.charAt(0)}</div>
          <div className="mobile-nav-drawer-profile-info">
            <span className="mobile-nav-drawer-profile-name">{profileName}</span>
            <span className="mobile-nav-drawer-profile-role">
              {String(t(`profiles.roles.${profileRoleKey}`))}
            </span>
          </div>
        </div>

        <nav className="mobile-nav-drawer-grid">
          {DASHBOARD_CAROUSEL_PAGES.map((page) => {
            const Icon = DASHBOARD_MOBILE_NAV_ICONS[page.spotlightLabelKey];
            const active = pageIndex === page.slotIndex;
            return (
              <button
                key={page.slotIndex}
                type="button"
                className={`mobile-nav-drawer-item${active ? " mobile-nav-drawer-item--active" : ""}`}
                onClick={() => navigate(page.slotIndex)}
                aria-current={active ? "page" : undefined}
              >
                <span className="mobile-nav-drawer-icon">
                  <Icon size={22} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                </span>
                <span className="mobile-nav-drawer-label">{page.guideTitle}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
