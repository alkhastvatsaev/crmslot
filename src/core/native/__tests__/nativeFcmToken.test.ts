import { fetchNativeFcmToken, onNativeFcmTokenRefresh } from "@/core/native/nativeFcmToken";
import * as capacitorRuntime from "@/core/native/capacitorRuntime";

jest.mock("@/core/native/capacitorRuntime", () => ({
  isCapacitorNative: jest.fn(),
  getCapacitorPlatform: jest.fn(),
}));

jest.mock("@/core/native/ensureAndroidPushChannels", () => ({
  ensureAndroidPushChannels: jest.fn(async () => undefined),
}));

const checkPermissions = jest.fn();
const requestPermissions = jest.fn();
const register = jest.fn();
const requestMessagingPermissions = jest.fn();
const getToken = jest.fn();
const addListenerMessaging = jest.fn();

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    checkPermissions: (...args: unknown[]) => checkPermissions(...args),
    requestPermissions: (...args: unknown[]) => requestPermissions(...args),
    register: (...args: unknown[]) => register(...args),
  },
}));

jest.mock("@capacitor-firebase/messaging", () => ({
  FirebaseMessaging: {
    requestPermissions: (...args: unknown[]) => requestMessagingPermissions(...args),
    getToken: (...args: unknown[]) => getToken(...args),
    addListener: (...args: unknown[]) => addListenerMessaging(...args),
  },
}));

describe("fetchNativeFcmToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(false);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("web");
  });

  it("retourne null sur web", async () => {
    expect(await fetchNativeFcmToken()).toBeNull();
    expect(checkPermissions).not.toHaveBeenCalled();
  });

  it("retourne null si plateforme non ios/android", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("web");

    expect(await fetchNativeFcmToken()).toBeNull();
  });

  it("retourne null si permission push refusée", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("android");
    checkPermissions.mockResolvedValue({ receive: "prompt" });
    requestPermissions.mockResolvedValue({ receive: "denied" });

    expect(await fetchNativeFcmToken()).toBeNull();
    expect(register).not.toHaveBeenCalled();
  });

  it("retourne token et plateforme si permission accordée", async () => {
    jest.mocked(capacitorRuntime.isCapacitorNative).mockReturnValue(true);
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("ios");
    checkPermissions.mockResolvedValue({ receive: "granted" });
    requestMessagingPermissions.mockResolvedValue(undefined);
    getToken.mockResolvedValue({ token: "fcm-token-xyz" });

    const reg = await fetchNativeFcmToken();
    expect(reg).toEqual({ token: "fcm-token-xyz", platform: "ios" });
    expect(register).toHaveBeenCalled();
  });
});

describe("onNativeFcmTokenRefresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    addListenerMessaging.mockResolvedValue({ remove: jest.fn() });
    jest.mocked(capacitorRuntime.getCapacitorPlatform).mockReturnValue("android");
  });

  it("notifie le handler quand un nouveau token arrive", async () => {
    let tokenHandler: ((event: { token: string }) => void) | undefined;
    addListenerMessaging.mockImplementation((event: string, cb: typeof tokenHandler) => {
      if (event === "tokenReceived") tokenHandler = cb;
      return Promise.resolve({ remove: jest.fn() });
    });

    const handler = jest.fn();
    await onNativeFcmTokenRefresh(handler);
    tokenHandler?.({ token: "refresh-token" });

    expect(handler).toHaveBeenCalledWith({ token: "refresh-token", platform: "android" });
  });
});
