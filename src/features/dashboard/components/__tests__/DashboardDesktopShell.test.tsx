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
import UserProfile from "@/features/dashboard/components/UserProfile";

describe("DashboardDesktopShell", () => {
  it("renders galaxy dock in center grid slot (column 2)", () => {
    render(
      <DashboardPagerProvider pageCount={6}>
        <DashboardPageSelectorProvider>
          <DashboardDesktopShell
            header={<span data-testid="shell-header">header</span>}
            pager={<span data-testid="shell-pager">pager</span>}
            galaxy={<button type="button">Galaxy</button>}
          />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
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

  it("affiche le panneau compte au centre au clic profil", () => {
    render(
      <DashboardPagerProvider pageCount={6}>
        <DashboardPageSelectorProvider>
          <DashboardDesktopShell
            header={<UserProfile interactive />}
            pager={<span data-testid="shell-pager">pager</span>}
            galaxy={<span>galaxy</span>}
          />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    );

    expect(screen.queryByTestId("dashboard-account-panel")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("user-profile-toggle"));
    const host = screen.getByTestId("dashboard-account-panel-host");
    expect(host).toBeInTheDocument();
    expect(host).toHaveClass("dashboard-desktop-col--center");
    expect(screen.getByTestId("dashboard-account-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
  });
});
