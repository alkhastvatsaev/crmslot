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

jest.mock("@/features/auth/hooks/useCrmStaffAccountPanel", () => ({
  useCrmStaffAccountPanel: () => ({
    fields: {
      email: "admin@test.com",
      firstName: "Jean",
      lastName: "Dupont",
      companyName: "Test Co",
      roleLabel: "admin",
    },
    ready: true,
    signingOut: false,
    signOut: jest.fn(),
  }),
}));

describe("MobileTopBar", () => {
  it("affiche le profil fixe en header", () => {
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
    expect(screen.getByTestId("mobile-header-profile-rail")).toBeInTheDocument();
    expect(screen.getByTestId("admin-mobile-profile-chip")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-header-profile")).toHaveAttribute(
      "data-mobile-header-rail-active",
      "true"
    );
  });

  it("toggle le panneau compte au clic profil", () => {
    function ToggleProbe() {
      const { view } = useDashboardPageSelector();
      return <div data-testid="account-state">{view === "account" ? "open" : "closed"}</div>;
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

    expect(screen.getByTestId("account-state")).toHaveTextContent("closed");
    fireEvent.click(screen.getByTestId("admin-mobile-profile-chip"));
    expect(screen.getByTestId("account-state")).toHaveTextContent("open");
  });
});
