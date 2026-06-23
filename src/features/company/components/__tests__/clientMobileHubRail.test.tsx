import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import { LayoutShellProvider } from "@/context/LayoutShellContext";
import { MobileHubRailProvider } from "@/features/dashboard/MobileHubRailContext";
import CompanyHubPage from "@/features/company/components/CompanyHubPage";
import { RequesterHubProvider } from "@/context/RequesterHubContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

/** Régression : `/m/demande` utilise MobileHubLayout → exige MobileHubRailProvider. */
describe("client mobile hub rail", () => {
  it("affiche le panneau central sans planter", () => {
    render(
      <DashboardPagerProvider pageCount={1}>
        <RequesterHubProvider>
          <LayoutShellProvider mode="mobile">
            <MobileHubRailProvider>
              <CompanyHubPage />
            </MobileHubRailProvider>
          </LayoutShellProvider>
        </RequesterHubProvider>
      </DashboardPagerProvider>
    );
    expect(screen.getByTestId("dashboard-secondary-panel-center")).toBeInTheDocument();
    expect(screen.getByTestId("requester-intervention-panel")).toBeInTheDocument();
  });
});
