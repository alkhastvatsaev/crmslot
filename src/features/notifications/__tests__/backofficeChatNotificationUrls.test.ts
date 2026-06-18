import {
  parseBackofficeChatNotificationData,
  parseBackofficeChatNotificationSearchParams,
} from "@/features/notifications/backofficeChatNotificationUrls";
import { BM_BACKOFFICE_CHAT_PARAM } from "@/features/notifications/notificationConstants";

describe("backofficeChatNotificationUrls", () => {
  it("parses bmBackofficeChat URL param", () => {
    const params = new URLSearchParams();
    params.set(BM_BACKOFFICE_CHAT_PARAM, "iv-42");
    expect(parseBackofficeChatNotificationSearchParams(params)).toEqual({
      kind: "chat",
      interventionId: "iv-42",
    });
  });

  it("parses FCM data portal_chat payload", () => {
    expect(
      parseBackofficeChatNotificationData({
        type: "portal_chat",
        interventionId: "iv-9",
        companyId: "co-1",
      })
    ).toEqual({ kind: "chat", interventionId: "iv-9" });

    expect(parseBackofficeChatNotificationData({ type: "portal_chat" })).toEqual({
      kind: "chat",
      interventionId: "global",
    });
  });
});
