import { registerNativePush } from "@/core/native/nativePush";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
  getCapacitorPlatform: jest.fn(),
}));

const checkPermissions = jest.fn();
const requestPermissions = jest.fn();
const register = jest.fn();
const addListener = jest.fn();

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    checkPermissions: (...args: unknown[]) => checkPermissions(...args),
    requestPermissions: (...args: unknown[]) => requestPermissions(...args),
    register: (...args: unknown[]) => register(...args),
    addListener: (...args: unknown[]) => addListener(...args),
  },
}));

describe("registerNativePush", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
    addListener.mockResolvedValue({ remove: jest.fn() });
  });

  it("no-op sur web", async () => {
    const onToken = jest.fn();
    await registerNativePush(onToken);

    expect(checkPermissions).not.toHaveBeenCalled();
    expect(onToken).not.toHaveBeenCalled();
  });

  it("sort si permission refusée", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("ios");
    checkPermissions.mockResolvedValue({ receive: "prompt" });
    requestPermissions.mockResolvedValue({ receive: "denied" });

    await registerNativePush(jest.fn());

    expect(register).not.toHaveBeenCalled();
    expect(addListener).not.toHaveBeenCalled();
  });

  it("enregistre les listeners et appelle onToken à la registration", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("android");
    checkPermissions.mockResolvedValue({ receive: "granted" });

    let registrationHandler: ((token: { value: string }) => void) | undefined;
    addListener.mockImplementation((event: string, cb: (token: { value: string }) => void) => {
      if (event === "registration") registrationHandler = cb;
      return Promise.resolve({ remove: jest.fn() });
    });

    const onToken = jest.fn();
    await registerNativePush(onToken);

    expect(addListener).toHaveBeenCalledWith("registration", expect.any(Function));
    expect(addListener).toHaveBeenCalledWith("registrationError", expect.any(Function));
    expect(register).toHaveBeenCalled();

    registrationHandler?.({ value: "apns-token" });
    expect(onToken).toHaveBeenCalledWith({ token: "apns-token", platform: "android" });
  });
});
