import { getCapacitorPlatform, isCapacitorNative } from "@/core/native/capacitorRuntime";

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => "ios" | "android" | "web";
  };
};

describe("capacitorRuntime", () => {
  afterEach(() => {
    delete (window as CapacitorWindow).Capacitor;
  });

  it("isCapacitorNative retourne false sans plugin Capacitor", () => {
    expect(isCapacitorNative()).toBe(false);
    expect(getCapacitorPlatform()).toBe("web");
  });

  it("isCapacitorNative lit Capacitor.isNativePlatform", () => {
    (window as CapacitorWindow).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
    };
    expect(isCapacitorNative()).toBe(true);
    expect(getCapacitorPlatform()).toBe("android");
  });

  it("getCapacitorPlatform retourne ios", () => {
    (window as CapacitorWindow).Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "ios",
    };
    expect(getCapacitorPlatform()).toBe("ios");
  });
});
