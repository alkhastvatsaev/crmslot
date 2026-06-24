import {
  applyTechnicianNotificationIntent,
  dispatchTechnicianNotificationIntent,
  parseTechnicianNotificationData,
  TECHNICIAN_NOTIFICATION_INTENT_EVENT,
} from "@/features/notifications/technicianNotificationIntent";
import { BM_TECH_CASE_PARAM } from "@/features/notifications/notificationConstants";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";
import * as pushNav from "@/features/notifications/pushNotificationNavigation";

jest.mock("@/features/notifications/pushNotificationNavigation", () => ({
  currentAppPathname: jest.fn(() => "/"),
  isTechnicianAppPath: jest.fn((pathname = "") => pathname.startsWith("/m/technician")),
  redirectToTechnicianApp: jest.fn(),
  isClientAppPath: jest.fn(),
  redirectToClientApp: jest.fn(),
}));

const pushNavMock = pushNav as jest.Mocked<typeof pushNav>;

describe("technicianNotificationIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushNavMock.currentAppPathname.mockReturnValue("/");
  });

  it("parseTechnicianNotificationData reads bmTechCase", () => {
    expect(parseTechnicianNotificationData({ [BM_TECH_CASE_PARAM]: " iv-99 " })).toEqual({
      kind: "case",
      caseId: "iv-99",
    });
  });

  it("parseTechnicianNotificationData reads assignment payload", () => {
    expect(
      parseTechnicianNotificationData({
        type: "assignment",
        interventionId: "iv-42",
      })
    ).toEqual({
      kind: "case",
      caseId: "iv-42",
    });
  });

  it("dispatchTechnicianNotificationIntent emits custom event on terrain route", () => {
    pushNavMock.currentAppPathname.mockReturnValue(TECHNICIAN_MOBILE_APP_ROUTE);
    const handler = jest.fn();
    window.addEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);
    dispatchTechnicianNotificationIntent({ kind: "case", caseId: "abc" });
    window.removeEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(pushNavMock.redirectToTechnicianApp).not.toHaveBeenCalled();
  });

  it("dispatchTechnicianNotificationIntent redirects outside terrain route", () => {
    dispatchTechnicianNotificationIntent({ kind: "case", caseId: "abc" });
    expect(pushNavMock.redirectToTechnicianApp).toHaveBeenCalledTimes(1);
    expect(pushNavMock.redirectToTechnicianApp.mock.calls[0][0].get(BM_TECH_CASE_PARAM)).toBe(
      "abc"
    );
  });

  it("applyTechnicianNotificationIntent clears URL on terrain route", () => {
    const setPendingCaseId = jest.fn();
    const replace = jest.fn();
    const searchParams = new URLSearchParams("bmTechCase=iv-1&foo=bar");
    const pager = {
      pageIndex: 0,
      pageCount: 1,
      setPageIndex: jest.fn(),
      goNext: jest.fn(),
      goPrev: jest.fn(),
    };

    applyTechnicianNotificationIntent(
      { kind: "case", caseId: "iv-1" },
      {
        pathname: TECHNICIAN_MOBILE_APP_ROUTE,
        pager,
        setPendingCaseId,
        router: { replace },
        searchParams,
      }
    );

    expect(setPendingCaseId).toHaveBeenCalledWith("iv-1");
    expect(pager.setPageIndex).toHaveBeenCalledWith(0);
    expect(replace).toHaveBeenCalledWith(`${TECHNICIAN_MOBILE_APP_ROUTE}?foo=bar`, {
      scroll: false,
    });
  });
});
