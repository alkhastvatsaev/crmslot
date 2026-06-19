import {
  DASHBOARD_CAROUSEL_NAV_SLOT_INDICES,
  DASHBOARD_CAROUSEL_PAGE_COUNT,
  DASHBOARD_CAROUSEL_PAGES,
  assertDashboardCarouselSlotAlignment,
  getDashboardCarouselHubPages,
  getDashboardCarouselPage,
  stepDashboardCarouselNavIndex,
  stepDashboardLinearPageIndex,
} from "@/features/dashboard/dashboardCarouselRegistry";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { GMAIL_HUB_SLOT_INDEX } from "@/features/gmail/gmailHubConstants";

import { TEAM_HUB_SLOT_INDEX } from "@/features/teamHub/teamHubConstants";
import { CASE_HUB_SLOT_INDEX } from "@/features/caseHub/caseHubConstants";
import { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";
import { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub/planningHubConstants";

describe("dashboardCarouselRegistry", () => {
  it("has 9 admin pages aligned with hub slot constants", () => {
    expect(() => assertDashboardCarouselSlotAlignment()).not.toThrow();
    expect(DASHBOARD_CAROUSEL_PAGE_COUNT).toBe(9);
  });

  it("maps Feature hub to index 1 and Gmail to index 4", () => {
    expect(FEATURE_HUB_SLOT_INDEX).toBe(1);
    expect(GMAIL_HUB_SLOT_INDEX).toBe(4);
    expect(BILLING_HUB_SLOT_INDEX).toBe(3);
    expect(getDashboardCarouselPage(1)?.profileName).toBe("MATÉRIEL");
    expect(getDashboardCarouselPage(4)?.profileName).toBe("GMAIL");
    expect(getDashboardCarouselPage(TEAM_HUB_SLOT_INDEX)?.profileName).toBe("ÉQUIPE");
  });

  it("does not include removed Assistant IA profile", () => {
    const names = DASHBOARD_CAROUSEL_PAGES.map((p) => p.profileName);
    expect(names).not.toContain("ASLANBECK");
    expect(names).not.toContain("MANSOUR");
    expect(names).not.toContain("SOCIÉTÉ BX");
    expect(names).not.toContain("ASSISTANT IA");
  });

  it("excludes Gmail from carousel nav slots but includes draft hubs", () => {
    expect(DASHBOARD_CAROUSEL_NAV_SLOT_INDICES).toEqual([
      0,
      1,
      2,
      3,
      TEAM_HUB_SLOT_INDEX,
      CASE_HUB_SLOT_INDEX,
      COMMISSIONS_HUB_SLOT_INDEX,
      PLANNING_HUB_SLOT_INDEX,
    ]);
    expect(stepDashboardCarouselNavIndex(0, "next")).toBe(1);
    expect(stepDashboardCarouselNavIndex(3, "next")).toBe(TEAM_HUB_SLOT_INDEX);
    expect(stepDashboardCarouselNavIndex(PLANNING_HUB_SLOT_INDEX, "next")).toBe(0);
    expect(stepDashboardCarouselNavIndex(4, "prev")).toBe(3);
  });

  it("lists all admin hubs in navigation grids", () => {
    expect(getDashboardCarouselHubPages()).toHaveLength(DASHBOARD_CAROUSEL_PAGE_COUNT);
  });

  it("step linear mobile parcourt les 9 pages dans l'ordre", () => {
    expect(stepDashboardLinearPageIndex(0, "next", 9)).toBe(1);
    expect(stepDashboardLinearPageIndex(1, "prev", 9)).toBe(0);
    expect(stepDashboardLinearPageIndex(8, "next", 9)).toBe(0);
    expect(stepDashboardLinearPageIndex(0, "prev", 9)).toBe(8);
    expect(stepDashboardLinearPageIndex(1, "next", 9)).toBe(2);
  });
});
