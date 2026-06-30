import { ANDROID_PUSH_CHANNELS } from "@/features/notifications/androidPushChannels";

const createChannel = jest.fn();

jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    createChannel: (...args: unknown[]) => createChannel(...args),
  },
}));

describe("ensureAndroidPushChannels", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    createChannel.mockResolvedValue(undefined);
  });

  async function loadModule(isNative: boolean, platform: "web" | "ios" | "android") {
    jest.doMock("@/core/native/capacitorRuntime", () => ({
      isCapacitorNative: () => isNative,
      getCapacitorPlatform: () => platform,
    }));
    const mod = await import("@/core/native/ensureAndroidPushChannels");
    return mod.ensureAndroidPushChannels;
  }

  it("no-op sur web", async () => {
    const ensure = await loadModule(false, "web");
    await ensure();
    expect(createChannel).not.toHaveBeenCalled();
  });

  it("no-op sur iOS", async () => {
    const ensure = await loadModule(true, "ios");
    await ensure();
    expect(createChannel).not.toHaveBeenCalled();
  });

  it("crée tous les canaux Android une seule fois", async () => {
    const ensure = await loadModule(true, "android");
    await ensure();
    await ensure();

    expect(createChannel).toHaveBeenCalledTimes(ANDROID_PUSH_CHANNELS.length);
    for (const channel of ANDROID_PUSH_CHANNELS) {
      expect(createChannel).toHaveBeenCalledWith(channel);
    }
  });

  it("continue si un canal échoue", async () => {
    createChannel.mockRejectedValueOnce(new Error("channel failed")).mockResolvedValue(undefined);

    const ensure = await loadModule(true, "android");
    await expect(ensure()).resolves.toBeUndefined();
    expect(createChannel).toHaveBeenCalledTimes(ANDROID_PUSH_CHANNELS.length);
  });
});
