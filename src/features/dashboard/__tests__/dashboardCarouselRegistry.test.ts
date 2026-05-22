import {
  DASHBOARD_CAROUSEL_PAGE_COUNT,
  DASHBOARD_CAROUSEL_PAGES,
  assertDashboardCarouselSlotAlignment,
  getDashboardCarouselPage,
} from "@/features/dashboard/dashboardCarouselRegistry";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

describe("dashboardCarouselRegistry", () => {
  it("has 7 pages aligned with hub slot constants", () => {
    expect(() => assertDashboardCarouselSlotAlignment()).not.toThrow();
    expect(DASHBOARD_CAROUSEL_PAGE_COUNT).toBe(7);
  });

  it("maps Gmail to index 3 and Billing to index 6", () => {
    expect(GMAIL_HUB_SLOT_INDEX).toBe(3);
    expect(BILLING_HUB_SLOT_INDEX).toBe(6);
    expect(getDashboardCarouselPage(3)?.profileName).toBe("GMAIL");
    expect(getDashboardCarouselPage(6)?.profileName).toBe("FACTURATION");
  });

  it("does not include removed Chatbot profile", () => {
    const names = DASHBOARD_CAROUSEL_PAGES.map((p) => p.profileName);
    expect(names).not.toContain("ASLANBECK");
  });
});
