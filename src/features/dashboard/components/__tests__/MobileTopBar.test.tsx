import { render, screen } from "@/test-utils/render";
import MobileTopBar from "@/features/dashboard/components/MobileTopBar";
import { DateProvider } from "@/context/DateContext";
import { DashboardPageSelectorProvider } from "@/features/dashboard/DashboardPageSelectorContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => null,
}));

describe("MobileTopBar", () => {
  it("affiche le bouton profil interactif", () => {
    render(
      <DateProvider>
        <DashboardPagerProvider pageCount={3}>
          <DashboardPageSelectorProvider>
            <MobileTopBar />
          </DashboardPageSelectorProvider>
        </DashboardPagerProvider>
      </DateProvider>
    );
    expect(screen.getByTestId("mobile-top-bar")).toBeInTheDocument();
    expect(screen.getByTestId("user-profile-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-header-rail")).toBeInTheDocument();
    expect(screen.getByTestId("clock-calendar-widget")).toBeInTheDocument();
  });
});
