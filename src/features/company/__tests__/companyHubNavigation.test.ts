import {
  navigateCompanyHub,
  resolveCompanyHubPageIndex,
  COMPANY_HUB_ANCHOR_SMART_FORM,
} from "@/features/company/companyHubNavigation";
import type { DashboardPagerApi } from "@/features/dashboard/dashboardPagerContext";
import {
  CLIENT_MOBILE_APP_ROUTE,
  CLIENT_MOBILE_APP_SLOT_INDEX,
} from "@/features/company/clientMobileAppConstants";

function mockPager(pageIndex = 0): DashboardPagerApi {
  return {
    pageIndex,
    pageCount: 1,
    setPageIndex: jest.fn(),
    goNext: jest.fn(),
    goPrev: jest.fn(),
  };
}

describe("companyHubNavigation", () => {
  it("resolveCompanyHubPageIndex returns client app slot", () => {
    expect(resolveCompanyHubPageIndex(CLIENT_MOBILE_APP_ROUTE)).toBe(CLIENT_MOBILE_APP_SLOT_INDEX);
    expect(resolveCompanyHubPageIndex("/m/demande/extra")).toBe(CLIENT_MOBILE_APP_SLOT_INDEX);
  });

  it("navigateCompanyHub sets pager on client route", () => {
    const pager = mockPager(0);
    navigateCompanyHub(pager, COMPANY_HUB_ANCHOR_SMART_FORM, { pathname: CLIENT_MOBILE_APP_ROUTE });
    expect(pager.setPageIndex).toHaveBeenCalledWith(CLIENT_MOBILE_APP_SLOT_INDEX);
  });

  it("navigateCompanyHub does not set pager off client route", () => {
    const pager = mockPager(0);
    navigateCompanyHub(pager, undefined, { pathname: "/" });
    expect(pager.setPageIndex).not.toHaveBeenCalled();
  });
});
