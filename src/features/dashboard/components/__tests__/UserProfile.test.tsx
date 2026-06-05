import { screen, fireEvent } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import UserProfile, { appProfiles } from "@/features/dashboard/components/UserProfile";
import { DASHBOARD_CAROUSEL_PAGE_COUNT } from "@/features/dashboard/dashboardCarouselRegistry";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

describe("UserProfile", () => {
  it("exposes one profile per carousel page (7, no Chatbot)", () => {
    expect(appProfiles).toHaveLength(DASHBOARD_CAROUSEL_PAGE_COUNT);
    expect(appProfiles.map((p) => p.name)).toEqual([
      "IVANA",
      "SOCIÉTÉ BX",
      "MANSOUR",
      "MATÉRIEL",
      "HISTORIQUE",
      "FACTURATION",
      "GMAIL",
    ]);
  });

  it("shows Gmail name on Gmail page index", () => {
    renderWithPager(<UserProfile />, DASHBOARD_CAROUSEL_PAGE_COUNT, {
      initialPageIndex: GMAIL_HUB_SLOT_INDEX,
    });
    expect(screen.getByTestId("profile-name")).toHaveTextContent("GMAIL");
  });

  it("skips spotlight-only pages when using carousel next", () => {
    renderWithPager(<UserProfile />, DASHBOARD_CAROUSEL_PAGE_COUNT, { initialPageIndex: 0 });
    expect(screen.getByTestId("profile-name")).toHaveTextContent("IVANA");
    fireEvent.click(screen.getByTestId("next-profile-btn"));
    expect(screen.getByTestId("profile-name")).toHaveTextContent("MATÉRIEL");
  });
});
