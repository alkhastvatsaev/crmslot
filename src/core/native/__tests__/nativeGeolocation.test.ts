import {
  getCurrentNativePosition,
  watchNativePosition,
  type GeolocationPlugin,
  type NativeGeolocationDeps,
} from "@/core/native/nativeGeolocation";

function makePlugin(overrides: Partial<GeolocationPlugin> = {}): GeolocationPlugin {
  return {
    checkPermissions: jest.fn(async () => ({ location: "granted" })),
    requestPermissions: jest.fn(async () => ({ location: "granted" })),
    getCurrentPosition: jest.fn(async () => ({
      timestamp: 123,
      coords: { latitude: 50.85, longitude: 4.35, accuracy: 10 },
    })),
    watchPosition: jest.fn(async () => "watch-id-1"),
    clearWatch: jest.fn(async () => undefined),
    ...overrides,
  };
}

function makeDeps(plugin: GeolocationPlugin, isNative = true): NativeGeolocationDeps {
  return {
    isNative: () => isNative,
    loadPlugin: async () => plugin,
  };
}

describe("getCurrentNativePosition", () => {
  it("retourne null si pas natif", async () => {
    const plugin = makePlugin();
    const result = await getCurrentNativePosition(makeDeps(plugin, false));
    expect(result).toBeNull();
    expect(plugin.checkPermissions).not.toHaveBeenCalled();
  });

  it("demande la permission si pas accordée", async () => {
    const plugin = makePlugin({
      checkPermissions: jest.fn(async () => ({ location: "prompt" })),
      requestPermissions: jest.fn(async () => ({ location: "granted" })),
    });
    const result = await getCurrentNativePosition(makeDeps(plugin));
    expect(plugin.requestPermissions).toHaveBeenCalled();
    expect(result?.latitude).toBe(50.85);
  });

  it("retourne null si permission refusée", async () => {
    const plugin = makePlugin({
      checkPermissions: jest.fn(async () => ({ location: "prompt" })),
      requestPermissions: jest.fn(async () => ({ location: "denied" })),
    });
    const result = await getCurrentNativePosition(makeDeps(plugin));
    expect(result).toBeNull();
    expect(plugin.getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe("watchNativePosition", () => {
  it("retourne null si pas natif", async () => {
    const plugin = makePlugin();
    const unsub = await watchNativePosition(() => {}, makeDeps(plugin, false));
    expect(unsub).toBeNull();
  });

  it("appelle onUpdate avec coords formatées", async () => {
    const onUpdate = jest.fn();
    let watchCallback: ((pos: unknown, err: unknown) => void) | undefined;
    const plugin = makePlugin({
      watchPosition: jest.fn(async (_opts, cb) => {
        watchCallback = cb as never;
        return "wid";
      }),
    });

    await watchNativePosition(onUpdate, makeDeps(plugin));
    watchCallback?.({ timestamp: 999, coords: { latitude: 1, longitude: 2, accuracy: 3 } }, null);

    expect(onUpdate).toHaveBeenCalledWith({
      latitude: 1,
      longitude: 2,
      accuracy: 3,
      timestamp: 999,
    });
  });

  it("ignore les events avec erreur", async () => {
    const onUpdate = jest.fn();
    let watchCallback: ((pos: unknown, err: unknown) => void) | undefined;
    const plugin = makePlugin({
      watchPosition: jest.fn(async (_opts, cb) => {
        watchCallback = cb as never;
        return "wid";
      }),
    });

    await watchNativePosition(onUpdate, makeDeps(plugin));
    watchCallback?.(null, new Error("GPS unavailable"));

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("retourne unsub qui appelle clearWatch", async () => {
    const plugin = makePlugin({
      watchPosition: jest.fn(async () => "id-42"),
    });
    const unsub = await watchNativePosition(() => {}, makeDeps(plugin));
    await unsub?.();
    expect(plugin.clearWatch).toHaveBeenCalledWith({ id: "id-42" });
  });
});
