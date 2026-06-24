import { renderHook, waitFor } from "@testing-library/react";
import { useBackofficeChatPushBootstrap } from "@/features/notifications/hooks/useBackofficeChatPushBootstrap";

const registerPushMock = jest.fn();

jest.mock("@/features/notifications/useBackofficePushMessaging", () => ({
  useBackofficePushMessaging: () => ({
    status: "idle",
    lastError: null,
    registerPush: registerPushMock,
  }),
}));

describe("useBackofficeChatPushBootstrap", () => {
  beforeEach(() => {
    registerPushMock.mockReset();
    Object.defineProperty(global, "Notification", {
      configurable: true,
      value: { permission: "default" },
    });
  });

  it("requests push permission once on idle admin", async () => {
    renderHook(() => useBackofficeChatPushBootstrap(true));
    await waitFor(() => expect(registerPushMock).toHaveBeenCalledTimes(1));
  });
});
