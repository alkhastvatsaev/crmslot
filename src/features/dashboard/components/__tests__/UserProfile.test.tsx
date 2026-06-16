import { screen, fireEvent } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import UserProfile, { appProfiles } from "@/features/dashboard/components/UserProfile";
import { DASHBOARD_CAROUSEL_PAGE_COUNT } from "@/features/dashboard/dashboardCarouselRegistry";
import {
  DashboardPageSelectorProvider,
  useDashboardPageSelector,
} from "@/features/dashboard/DashboardPageSelectorContext";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

describe("UserProfile", () => {
  it("shows one profile per carousel page (6 admin hubs)", () => {
    expect(appProfiles).toHaveLength(DASHBOARD_CAROUSEL_PAGE_COUNT);
    expect(appProfiles.map((p) => p.name)).toEqual([
      "IVANA",
      "MATÉRIEL",
      "QUALITY MANAGEMENT",
      "FACTURATION",
      "GMAIL",
      "ASSISTANT IA",
    ]);
  });

  it("shows Gmail name on Gmail page index", () => {
    renderWithPager(
      <DashboardPageSelectorProvider>
        <UserProfile interactive />
      </DashboardPageSelectorProvider>,
      DASHBOARD_CAROUSEL_PAGE_COUNT,
      { initialPageIndex: GMAIL_HUB_SLOT_INDEX }
    );
    expect(screen.getByTestId("profile-name")).toHaveTextContent("GMAIL");
  });

  it("toggle le sélecteur de pages au clic profil desktop", () => {
    function ToggleProbe() {
      const { open } = useDashboardPageSelector();
      return <div data-testid="selector-state">{open ? "open" : "closed"}</div>;
    }

    renderWithPager(
      <DashboardPageSelectorProvider>
        <UserProfile interactive />
        <ToggleProbe />
      </DashboardPageSelectorProvider>,
      DASHBOARD_CAROUSEL_PAGE_COUNT,
      { initialPageIndex: 0 }
    );

    expect(screen.getByTestId("selector-state")).toHaveTextContent("closed");
    expect(screen.getByTestId("user-profile-toggle")).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(screen.getByTestId("user-profile-toggle"));
    expect(screen.getByTestId("selector-state")).toHaveTextContent("open");
    expect(screen.getByTestId("user-profile-toggle")).toHaveAttribute("aria-expanded", "true");
  });

  it("affiche le label mobile interactif", () => {
    renderWithPager(
      <DashboardPageSelectorProvider>
        <UserProfile interactive variant="mobile" />
      </DashboardPageSelectorProvider>,
      DASHBOARD_CAROUSEL_PAGE_COUNT,
      { initialPageIndex: 0 }
    );
    expect(screen.getByTestId("user-profile-toggle")).toBeInTheDocument();
    expect(screen.queryByTestId("prev-profile-btn")).not.toBeInTheDocument();
    expect(screen.queryByTestId("next-profile-btn")).not.toBeInTheDocument();
  });
});
