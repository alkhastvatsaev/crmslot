import { registerNativePushClickHandler } from "@/core/native/nativePushClickHandler";
import { TECHNICIAN_NOTIFICATION_INTENT_EVENT } from "@/features/notifications";
import { BM_TECH_CASE_PARAM } from "@/features/notifications";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(() => true),
}));

const mockRemove = jest.fn(() => Promise.resolve());
const mockAddListener = jest.fn((_event: string, _cb: unknown) =>
  Promise.resolve({ remove: mockRemove })
);

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    addListener: (event: string, cb: unknown) => mockAddListener(event, cb),
  },
}));

const { isCapacitorNative } = jest.requireMock("@/core/native/capacitorRuntime") as {
  isCapacitorNative: jest.Mock;
};

describe("nativePushClickHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isCapacitorNative.mockReturnValue(true);
  });

  it("registers pushNotificationActionPerformed on native", async () => {
    const unlisten = await registerNativePushClickHandler();
    expect(mockAddListener).toHaveBeenCalledWith(
      "pushNotificationActionPerformed",
      expect.any(Function)
    );
    unlisten();
    expect(mockRemove).toHaveBeenCalled();
  });

  it("dispatches intent event when notification tapped", async () => {
    const handler = jest.fn();
    window.addEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);

    await registerNativePushClickHandler();
    const calls = mockAddListener.mock.calls as Array<[string, (event: unknown) => void]>;
    const listener = calls[0]?.[1];
    expect(listener).toBeDefined();

    listener({
      notification: { data: { [BM_TECH_CASE_PARAM]: "case-42" } },
    });

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(TECHNICIAN_NOTIFICATION_INTENT_EVENT, handler);
  });

  it("no-ops when not native", async () => {
    isCapacitorNative.mockReturnValue(false);
    await registerNativePushClickHandler();
    expect(mockAddListener).not.toHaveBeenCalled();
  });
});
