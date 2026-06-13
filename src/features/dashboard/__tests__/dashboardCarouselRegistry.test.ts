import {
  DASHBOARD_CAROUSEL_NAV_SLOT_INDICES,
  DASHBOARD_CAROUSEL_PAGE_COUNT,
  DASHBOARD_CAROUSEL_PAGES,
  assertDashboardCarouselSlotAlignment,
  getDashboardCarouselPage,
  stepDashboardCarouselNavIndex,
  stepDashboardLinearPageIndex,
} from "@/features/dashboard/dashboardCarouselRegistry";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

describe("dashboardCarouselRegistry", () => {
  it("has 8 pages aligned with hub slot constants", () => {
    expect(() => assertDashboardCarouselSlotAlignment()).not.toThrow();
    expect(DASHBOARD_CAROUSEL_PAGE_COUNT).toBe(8);
  });

  it("maps Feature hub to index 3 and Gmail to index 6", () => {
    expect(GMAIL_HUB_SLOT_INDEX).toBe(6);
    expect(BILLING_HUB_SLOT_INDEX).toBe(5);
    expect(getDashboardCarouselPage(3)?.profileName).toBe("MATÉRIEL");
    expect(getDashboardCarouselPage(6)?.profileName).toBe("GMAIL");
  });

  it("does not include removed Chatbot profile", () => {
    const names = DASHBOARD_CAROUSEL_PAGES.map((p) => p.profileName);
    expect(names).not.toContain("ASLANBECK");
  });

  it("excludes company, technician and Gmail from carousel nav slots", () => {
    expect(DASHBOARD_CAROUSEL_NAV_SLOT_INDICES).toEqual([0, 3, 4, 5]);
    expect(stepDashboardCarouselNavIndex(0, "next")).toBe(3);
    expect(stepDashboardCarouselNavIndex(5, "next")).toBe(0);
    expect(stepDashboardCarouselNavIndex(6, "prev")).toBe(5);
    expect(stepDashboardCarouselNavIndex(1, "next")).toBe(3);
    expect(stepDashboardCarouselNavIndex(1, "prev")).toBe(0);
  });

  it("step linear mobile parcourt les 8 pages dans l'ordre", () => {
    expect(stepDashboardLinearPageIndex(0, "next", 8)).toBe(1);
    expect(stepDashboardLinearPageIndex(1, "prev", 8)).toBe(0);
    expect(stepDashboardLinearPageIndex(7, "next", 8)).toBe(0);
    expect(stepDashboardLinearPageIndex(0, "prev", 8)).toBe(7);
    expect(stepDashboardLinearPageIndex(2, "next", 8)).toBe(3);
  });
});
