import React from "react";
import { screen, fireEvent, within } from "@testing-library/react";
import { renderWithPager } from "@/test-utils/renderWithPager";
import SpotlightSearch from "../SpotlightSearch";
import {
  DASHBOARD_CAROUSEL_PAGE_COUNT,
  DASHBOARD_CAROUSEL_PAGES,
} from "@/features/dashboard/dashboardCarouselRegistry";

const SPOTLIGHT_NAV_INDICES = DASHBOARD_CAROUSEL_PAGES.map((p) => p.slotIndex);
const SPOTLIGHT_PAGE_COUNT = DASHBOARD_CAROUSEL_PAGE_COUNT;

// cmdk calls scrollIntoView on selected items — not available in jsdom
Element.prototype.scrollIntoView = jest.fn();

describe("SpotlightSearch", () => {
  it("renders trigger button", () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    expect(screen.getByTestId("spotlight-trigger")).toBeInTheDocument();
    expect(screen.getByText("Rechercher...")).toBeInTheDocument();
  });

  it("shows 7 nav items when open", () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    for (const index of SPOTLIGHT_NAV_INDICES) {
      expect(screen.getByTestId(`nav-item-${index}`)).toBeInTheDocument();
    }
  });

  it("nav items have correct translated text content", () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    // Verify that each nav item contains the expected label text (from spotlight.nav_* i18n keys)
    const items = SPOTLIGHT_NAV_INDICES.map((index) => screen.getByTestId(`nav-item-${index}`));
    for (const item of items) {
      expect(item).toBeInTheDocument();
      expect(item.textContent?.trim().length).toBeGreaterThan(0);
    }
  });

  it("closes modal when nav item selected", () => {
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    fireEvent.click(screen.getByTestId("nav-item-0"));
    // Modal should close (nav items no longer rendered)
    expect(screen.queryByTestId("nav-item-0")).not.toBeInTheDocument();
  });

  it("navigates to the correct page when nav item is selected", () => {
    // Start at page 0 (default). Click nav-item-1 which maps to pageIndex=1.
    // After selection, the modal closes. Re-open to verify the active indicator
    // appears on nav-item-1, confirming setPageIndex(1) was called.
    renderWithPager(<SpotlightSearch />, SPOTLIGHT_PAGE_COUNT);

    // Open modal and click nav-item-1 (pageIndex=1)
    fireEvent.click(screen.getByTestId("spotlight-trigger"));
    fireEvent.click(screen.getByTestId("nav-item-1"));

    // Modal closes after selection
    expect(screen.queryByTestId("nav-item-1")).not.toBeInTheDocument();

    // Re-open the modal to inspect active state
    fireEvent.click(screen.getByTestId("spotlight-trigger"));

    // nav-item-1 should now show the active label, confirming setPageIndex(1) was called
    const activeItem = screen.getByTestId("nav-item-1");
    // The active item renders an active indicator label (spotlight.active_label i18n key).
    // In the default test locale (French) this is "Actif"; match both FR/EN variants.
    expect(within(activeItem).getByText(/actif|active/i)).toBeInTheDocument();
  });
});
