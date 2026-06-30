import { registerNativePushForegroundHandler } from "@/core/native/nativePushForeground";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";
import { toast } from "sonner";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
}));

const mockRemove = jest.fn(() => Promise.resolve());
const addListener = jest.fn();

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    addListener: (...args: unknown[]) => addListener(...args),
  },
}));

jest.mock("sonner", () => ({
  toast: { message: jest.fn() },
}));

describe("registerNativePushForegroundHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
    addListener.mockResolvedValue({ remove: mockRemove });
  });

  it("retourne un noop sur web", async () => {
    const unlisten = await registerNativePushForegroundHandler();
    unlisten();
    expect(addListener).not.toHaveBeenCalled();
  });

  it("affiche un toast quand une notif arrive au premier plan", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);

    let receivedHandler: ((event: { title?: string; body?: string }) => void) | undefined;
    addListener.mockImplementation((event: string, cb: typeof receivedHandler) => {
      if (event === "pushNotificationReceived") receivedHandler = cb;
      return Promise.resolve({ remove: mockRemove });
    });

    const unlisten = await registerNativePushForegroundHandler();
    receivedHandler?.({ title: "Mission", body: "Nouvelle intervention" });

    expect(toast.message).toHaveBeenCalledWith("Mission", {
      description: "Nouvelle intervention",
    });

    unlisten();
    expect(mockRemove).toHaveBeenCalled();
  });

  it("utilise un titre par défaut si absent", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);

    let receivedHandler: ((event: { body?: string }) => void) | undefined;
    addListener.mockImplementation((event: string, cb: typeof receivedHandler) => {
      if (event === "pushNotificationReceived") receivedHandler = cb;
      return Promise.resolve({ remove: mockRemove });
    });

    await registerNativePushForegroundHandler();
    receivedHandler?.({ body: "Alerte stock" });

    expect(toast.message).toHaveBeenCalledWith("CRMSLOT", { description: "Alerte stock" });
  });
});
