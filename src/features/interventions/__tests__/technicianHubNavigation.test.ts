import {
  navigateTechnicianHub,
  resolveTechnicianHubPageIndex,
  TECHNICIAN_HUB_ANCHOR_MISSIONS,
} from "@/features/interventions/technicianHubNavigation";
import type { DashboardPagerApi } from "@/features/dashboard";
import {
  TECHNICIAN_MOBILE_APP_ROUTE,
  TECHNICIAN_MOBILE_APP_SLOT_INDEX,
} from "@/features/interventions/technicianMobileAppConstants";

function mockPager(pageIndex = 0): DashboardPagerApi {
  return {
    pageIndex,
    pageCount: 1,
    setPageIndex: jest.fn(),
    goNext: jest.fn(),
    goPrev: jest.fn(),
  };
}

describe("technicianHubNavigation", () => {
  it("resolveTechnicianHubPageIndex returns 0 on app terrain route", () => {
    expect(resolveTechnicianHubPageIndex(TECHNICIAN_MOBILE_APP_ROUTE)).toBe(
      TECHNICIAN_MOBILE_APP_SLOT_INDEX
    );
    expect(resolveTechnicianHubPageIndex("/m/technician/extra")).toBe(
      TECHNICIAN_MOBILE_APP_SLOT_INDEX
    );
  });

  it("resolveTechnicianHubPageIndex returns terrain slot off-route", () => {
    expect(resolveTechnicianHubPageIndex("/")).toBe(TECHNICIAN_MOBILE_APP_SLOT_INDEX);
    expect(resolveTechnicianHubPageIndex(undefined)).toBe(TECHNICIAN_MOBILE_APP_SLOT_INDEX);
  });

  it("navigateTechnicianHub sets page index 0 on terrain route", () => {
    const pager = mockPager(0);
    navigateTechnicianHub(pager, TECHNICIAN_HUB_ANCHOR_MISSIONS, {
      pathname: TECHNICIAN_MOBILE_APP_ROUTE,
    });
    expect(pager.setPageIndex).toHaveBeenCalledWith(TECHNICIAN_MOBILE_APP_SLOT_INDEX);
  });

  it("navigateTechnicianHub does not set pager index off terrain route", () => {
    const pager = mockPager(0);
    navigateTechnicianHub(pager, undefined, { pathname: "/" });
    expect(pager.setPageIndex).not.toHaveBeenCalled();
  });
});
