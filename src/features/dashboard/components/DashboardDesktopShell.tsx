"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import {
  TECHNICIAN_LAB_IN_CAROUSEL,
  TECHNICIAN_LAB_SLOT_INDEX,
} from "@/features/technicians/technicianLabConstants";
import {
  DASHBOARD_DESKTOP_APP_SHELL_CLASS,
  DASHBOARD_DESKTOP_CANVAS_CLASS,
  DASHBOARD_DESKTOP_GALAXY_DOCK_CHROME_CLASS,
  DASHBOARD_DESKTOP_GALAXY_DOCK_CLASS,
  DASHBOARD_DESKTOP_COL_CLASS,
  DASHBOARD_DESKTOP_GRID_CLASS,
  DASHBOARD_DESKTOP_GRID_FILL_CLASS,
  DASHBOARD_DESKTOP_OVERLAY_ROOT_CLASS,
  DASHBOARD_DESKTOP_STACK_BODY_CLASS,
  DASHBOARD_DESKTOP_STACK_CLASS,
  DASHBOARD_DESKTOP_STACK_HEADER_CLASS,
} from "@/core/ui/dashboardDesktopLayout";
import DashboardPageSelector from "@/features/dashboard/components/DashboardPageSelector";
import DashboardAccountPanel from "@/features/dashboard/components/DashboardAccountPanel";
import { useDashboardPageSelector } from "@/features/dashboard/DashboardPageSelectorContext";
import AdminMobileProfileChip from "@/features/dashboard/components/AdminMobileProfileChip";
import ClockCalendar from "@/features/dashboard/components/ClockCalendar";
import SpotlightSearch from "@/features/dashboard/components/SpotlightSearch";

type Props = {
  pager: ReactNode;
  galaxy: ReactNode;
};

/**
 * Desktop shell — rails 1–4 via `.dashboard-desktop-grid`.
 * Page 6 (`/technician`) : mode immersif sans header ni galaxy (écran autonome).
 */
function DashboardDesktopHeader() {
  return (
    <>
      <aside
        className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left pointer-events-auto`}
      >
        <ClockCalendar compact interactive variant="desktop" />
      </aside>
      <div
        className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center pointer-events-auto flex flex-col gap-2`}
      >
        <SpotlightSearch />
      </div>
      <aside
        className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right pointer-events-auto`}
      >
        <AdminMobileProfileChip variant="desktop" />
      </aside>
    </>
  );
}

export default function DashboardDesktopShell({ pager, galaxy }: Props) {
  const dashboardPager = useDashboardPagerOptional();
  const { view, close: closeOverlay } = useDashboardPageSelector();
  const overlayOpen = view !== "closed";
  const immersiveTechnicianLab =
    TECHNICIAN_LAB_IN_CAROUSEL && dashboardPager?.pageIndex === TECHNICIAN_LAB_SLOT_INDEX;

  return (
    <div id="dashboard-root-scroll" className={DASHBOARD_DESKTOP_APP_SHELL_CLASS}>
      <div
        className={cn(
          DASHBOARD_DESKTOP_CANVAS_CLASS,
          immersiveTechnicianLab && "dashboard-desktop-canvas--technician-lab"
        )}
      >
        <div
          className={cn(
            DASHBOARD_DESKTOP_STACK_CLASS,
            immersiveTechnicianLab && "dashboard-desktop-stack--technician-lab"
          )}
          data-testid="dashboard-desktop-stack"
        >
          {!immersiveTechnicianLab ? (
            <header
              className={DASHBOARD_DESKTOP_STACK_HEADER_CLASS}
              data-testid="dashboard-global-header"
            >
              <div className={DASHBOARD_DESKTOP_GRID_CLASS}>
                <DashboardDesktopHeader />
              </div>
            </header>
          ) : null}

          <div className={DASHBOARD_DESKTOP_STACK_BODY_CLASS}>
            <div
              id="dashboard-overlay-root"
              className={DASHBOARD_DESKTOP_OVERLAY_ROOT_CLASS}
              aria-hidden
            />
            <div className="dashboard-desktop-pager-host">
              {pager}
              {overlayOpen && !immersiveTechnicianLab ? (
                <div className="dashboard-page-selector-host" aria-hidden={false}>
                  <div
                    className={`${DASHBOARD_DESKTOP_GRID_CLASS} ${DASHBOARD_DESKTOP_GRID_FILL_CLASS} dashboard-page-selector-host-grid`}
                  >
                    <div
                      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--left pointer-events-none`}
                      aria-hidden
                    />
                    <div
                      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--center dashboard-desktop-overlay-center-slot`}
                      data-testid="dashboard-desktop-overlay-center"
                    >
                      {view === "pages" ? (
                        <div
                          className="dashboard-desktop-overlay-center-panel"
                          data-testid="dashboard-page-selector-host"
                        >
                          <DashboardPageSelector onClose={closeOverlay} variant="desktop" />
                        </div>
                      ) : null}
                      {view === "account" ? (
                        <div
                          className="dashboard-desktop-overlay-center-panel"
                          data-testid="dashboard-account-panel-host"
                        >
                          <DashboardAccountPanel onClose={closeOverlay} variant="desktop" />
                        </div>
                      ) : null}
                    </div>
                    <div
                      className={`${DASHBOARD_DESKTOP_COL_CLASS} dashboard-desktop-col--right pointer-events-none`}
                      aria-hidden
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!immersiveTechnicianLab ? (
            <div
              id="dashboard-galaxy-dock"
              className={DASHBOARD_DESKTOP_GALAXY_DOCK_CLASS}
              data-testid="dashboard-galaxy-dock"
            >
              <div
                className={DASHBOARD_DESKTOP_GALAXY_DOCK_CHROME_CLASS}
                data-testid="dashboard-galaxy-center-slot"
              >
                <div className="dashboard-desktop-galaxy-dock-chrome-inner">{galaxy}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
