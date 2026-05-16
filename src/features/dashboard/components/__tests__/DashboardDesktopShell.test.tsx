import { render, screen } from "@/test-utils/render";
import {
  DASHBOARD_DESKTOP_GALAXY_DOCK_CLASS,
  DASHBOARD_DESKTOP_GALAXY_DOCK_CHROME_CLASS,
  DASHBOARD_DESKTOP_STACK_CLASS,
  DASHBOARD_GALAXY_GRID_COLUMN,
} from "@/core/ui/dashboardDesktopLayout";
import DashboardDesktopShell from "@/features/dashboard/components/DashboardDesktopShell";

describe("DashboardDesktopShell", () => {
  it("renders galaxy dock in center grid slot (column 2)", () => {
    render(
      <DashboardDesktopShell
        header={<span data-testid="shell-header">header</span>}
        pager={<span data-testid="shell-pager">pager</span>}
        galaxy={<button type="button">Galaxy</button>}
      />,
    );

    expect(screen.getByTestId("dashboard-desktop-stack")).toHaveClass(
      DASHBOARD_DESKTOP_STACK_CLASS,
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
});
