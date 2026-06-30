import React from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import {
  DASHBOARD_DESKTOP_GALAXY_DOCK_CLASS,
  DASHBOARD_DESKTOP_GALAXY_DOCK_CHROME_CLASS,
  DASHBOARD_DESKTOP_STACK_CLASS,
  DASHBOARD_GALAXY_GRID_COLUMN,
} from "@/core/ui/dashboardDesktopLayout";
import DashboardDesktopShell from "@/features/dashboard/components/DashboardDesktopShell";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { DateProvider } from "@/context/DateContext";

function renderShell(ui: React.ReactElement) {
  return render(
    <DateProvider>
      <DashboardPagerProvider pageCount={9}>
        <DashboardPageSelectorProvider>{ui}</DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    </DateProvider>
  );
}

describe("DashboardDesktopShell", () => {
  it("renders galaxy dock in center grid slot (column 2)", () => {
    renderShell(
      <DashboardDesktopShell
        pager={<span data-testid="shell-pager">pager</span>}
        galaxy={<button type="button">Galaxy</button>}
      />
    );

    expect(screen.getByTestId("dashboard-desktop-stack")).toHaveClass(
      DASHBOARD_DESKTOP_STACK_CLASS
    );
    expect(screen.getByTestId("dashboard-global-header")).toBeInTheDocument();
    expect(screen.getByTestId("shell-pager")).toBeInTheDocument();

    const dock = screen.getByTestId("dashboard-galaxy-dock");
    expect(dock).toHaveClass(DASHBOARD_DESKTOP_GALAXY_DOCK_CLASS);
    expect(dock).toHaveAttribute("id", "dashboard-galaxy-dock");

    const slot = screen.getByTestId("dashboard-galaxy-center-slot");
    expect(slot).toHaveClass(DASHBOARD_DESKTOP_GALAXY_DOCK_CHROME_CLASS);
    expect(slot).toHaveClass("panel-glass");
    expect(screen.getByRole("button", { name: "Galaxy" })).toBeInTheDocument();
    expect(DASHBOARD_GALAXY_GRID_COLUMN).toBe(2);
  });

  it("affiche le panneau compte au centre au clic profil desktop", () => {
    renderShell(
      <DashboardDesktopShell
        pager={<span data-testid="shell-pager">pager</span>}
        galaxy={<span>galaxy</span>}
      />
    );

    expect(screen.queryByTestId("dashboard-account-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("admin-mobile-profile-chip"));
    const host = screen.getByTestId("dashboard-account-panel-host");
    expect(host).toBeInTheDocument();
    expect(host).toHaveClass("dashboard-desktop-col--center");
    expect(screen.getByTestId("dashboard-account-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
  });

  it("affiche le menu pages à droite au clic calendrier desktop", () => {
    renderShell(
      <DashboardDesktopShell
        pager={<span data-testid="shell-pager">pager</span>}
        galaxy={<span>galaxy</span>}
      />
    );

    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("clock-calendar-toggle"));
    const host = screen.getByTestId("dashboard-page-selector-host");
    expect(host).toBeInTheDocument();
    expect(host).toHaveClass("dashboard-desktop-col--right");
    expect(screen.getByTestId("dashboard-page-selector")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-account-panel")).not.toBeInTheDocument();
  });
});
