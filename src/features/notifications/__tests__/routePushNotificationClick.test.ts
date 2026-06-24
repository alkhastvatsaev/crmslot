import { routePushNotificationClick } from "@/features/notifications/routePushNotificationClick";
import { TECHNICIAN_NOTIFICATION_INTENT_EVENT } from "@/features/notifications/technicianNotificationIntent";
import { CLIENT_NOTIFICATION_INTENT_EVENT } from "@/features/notifications/clientNotificationIntent";
import { BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT } from "@/features/notifications/backofficeChatNotificationIntent";
import { TECHNICIAN_MOBILE_APP_ROUTE } from "@/features/interventions/technicianMobileAppConstants";
import { CLIENT_MOBILE_APP_ROUTE } from "@/features/company/clientMobileAppConstants";
import * as pushNav from "@/features/notifications/pushNotificationNavigation";

jest.mock("@/features/notifications/pushNotificationNavigation", () => ({
  currentAppPathname: jest.fn(() => "/"),
  isTechnicianAppPath: jest.fn((pathname = "") => pathname.startsWith("/m/technician")),
  redirectToTechnicianApp: jest.fn(),
  isClientAppPath: jest.fn((pathname = "") => pathname.startsWith("/m/demande")),
  redirectToClientApp: jest.fn(),
}));

const pushNavMock = pushNav as jest.Mocked<typeof pushNav>;

describe("routePushNotificationClick", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pushNavMock.currentAppPathname.mockReturnValue("/");
  });

  it("routes assignment to technician intent", () => {
    pushNavMock.currentAppPathname.mockReturnValue(TECHNICIAN_MOBILE_APP_ROUTE);
    const handler = jest.fn();
    window.addEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);
    routePushNotificationClick({ type: "assignment", interventionId: "iv-7" });
    window.removeEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
      kind: "case",
      caseId: "iv-7",
    });
  });

  it("routes portal chat client to client intent", () => {
    pushNavMock.currentAppPathname.mockReturnValue(CLIENT_MOBILE_APP_ROUTE);
    const handler = jest.fn();
    window.addEventListener(CLIENT_NOTIFICATION_INTENT_EVENT, handler);
    routePushNotificationClick({
      type: "portal_chat",
      audience: "client",
      interventionId: "iv-chat",
    });
    window.removeEventListener(CLIENT_NOTIFICATION_INTENT_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
      kind: "chat",
      caseId: "iv-chat",
    });
  });

  it("routes portal chat staff to backoffice intent", () => {
    const handler = jest.fn();
    window.addEventListener(BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT, handler);
    routePushNotificationClick({
      type: "portal_chat",
      audience: "staff",
      interventionId: "iv-staff",
    });
    window.removeEventListener(BACKOFFICE_CHAT_NOTIFICATION_INTENT_EVENT, handler);
    expect(handler).toHaveBeenCalledTimes(1);
    expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
      kind: "chat",
      interventionId: "iv-staff",
    });
  });
});
