import type { ReactNode } from "react";
import { render, screen, fireEvent } from "@/test-utils/render";
import MobileShell from "@/features/dashboard/components/MobileShell";
import { DateProvider } from "@/context/DateContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="galaxy-layer" />,
}));

function renderMobileShell(pages: ReactNode[]) {
  return render(
    <DateProvider>
      <DashboardPagerProvider pageCount={pages.length}>
        <DashboardPageSelectorProvider>
          <MobileShell pages={pages} />
        </DashboardPageSelectorProvider>
      </DashboardPagerProvider>
    </DateProvider>
  );
}

describe("MobileShell", () => {
  it("compose header, écran unique et footer", () => {
    renderMobileShell([<div key="0">Hub A</div>, <div key="1">Hub B</div>]);

    expect(screen.getByTestId("mobile-shell")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-screen-host")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-shell-footer")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-hub-dots-bar")).not.toBeInTheDocument();
    expect(screen.getByText("Hub A")).toBeInTheDocument();
  });

  it("affiche le sélecteur dans le panneau central au clic profil", () => {
    renderMobileShell([<div key="0">A</div>, <div key="1">B</div>, <div key="2">C</div>]);

    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-page-0")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("user-profile-toggle"));
    expect(screen.getByTestId("dashboard-page-selector-host")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page-selector")).toBeInTheDocument();
    expect(screen.getByText("A").closest("[aria-hidden='true']")).toBeTruthy();

    fireEvent.click(screen.getByTestId("dashboard-page-selector-item-2"));
    expect(screen.queryByTestId("dashboard-page-selector")).not.toBeInTheDocument();
    expect(screen.getByTestId("mobile-page-2")).toBeInTheDocument();
  });
});
