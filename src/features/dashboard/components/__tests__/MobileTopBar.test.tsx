import { fireEvent, render, screen } from "@/test-utils/render";
import MobileTopBar from "@/features/dashboard/components/MobileTopBar";
import { DateProvider } from "@/context/DateContext";
import {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
} from "@/features/dashboard/DashboardPageSelectorContext";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";

jest.mock("@/features/map/components/DashboardGalaxyLayer", () => ({
  __esModule: true,
  default: () => null,
}));

describe("MobileTopBar", () => {
  it("affiche le calendrier fixe en header", () => {
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
    expect(screen.getByTestId("clock-calendar-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-header-rail")).toBeInTheDocument();
    expect(screen.getByTestId("clock-calendar-widget")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-header-calendar")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );
  });

  it("toggle le sélecteur de pages au clic calendrier", () => {
    function ToggleProbe() {
      const { open } = useDashboardPageSelector();
      return <div data-testid="selector-state">{open ? "open" : "closed"}</div>;
    }

    render(
      <DateProvider>
        <DashboardPagerProvider pageCount={3}>
          <DashboardPageSelectorProvider>
            <MobileTopBar />
            <ToggleProbe />
          </DashboardPageSelectorProvider>
        </DashboardPagerProvider>
      </DateProvider>
    );

    expect(screen.getByTestId("selector-state")).toHaveTextContent("closed");
    fireEvent.click(screen.getByTestId("clock-calendar-toggle"));
    expect(screen.getByTestId("selector-state")).toHaveTextContent("open");
  });
});
