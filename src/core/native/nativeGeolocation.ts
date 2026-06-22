import { isCapacitorNative } from "./capacitorRuntime";

export type NativeCoords = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type Permission = "granted" | "denied" | "prompt";

export type GeolocationPlugin = {
  checkPermissions: () => Promise<{ location: Permission }>;
  requestPermissions: (opts: { permissions: ["location"] }) => Promise<{ location: Permission }>;
  getCurrentPosition: (opts: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }) => Promise<{
    timestamp: number;
    coords: { latitude: number; longitude: number; accuracy: number };
  }>;
  watchPosition: (
    opts: { enableHighAccuracy?: boolean; timeout?: number },
    callback: (
      pos: {
        timestamp: number;
        coords: { latitude: number; longitude: number; accuracy: number };
      } | null,
      err: unknown
    ) => void
  ) => Promise<string>;
  clearWatch: (opts: { id: string }) => Promise<void>;
};

export type NativeGeolocationDeps = {
  isNative: () => boolean;
  loadPlugin: () => Promise<GeolocationPlugin>;
};

const PROD_DEPS: NativeGeolocationDeps = {
  isNative: isCapacitorNative,
  loadPlugin: async () => {
    const mod = await import("@capacitor/geolocation");
    return mod.Geolocation as unknown as GeolocationPlugin;
  },
};

async function ensurePermission(plugin: GeolocationPlugin): Promise<boolean> {
  const perm = await plugin.checkPermissions();
  if (perm.location === "granted") return true;
  const req = await plugin.requestPermissions({ permissions: ["location"] });
  return req.location === "granted";
}

export async function getCurrentNativePosition(
  deps: NativeGeolocationDeps = PROD_DEPS
): Promise<NativeCoords | null> {
  if (!deps.isNative()) return null;
  const plugin = await deps.loadPlugin();
  if (!(await ensurePermission(plugin))) return null;
  const pos = await plugin.getCurrentPosition({
    enableHighAccuracy: true,
    timeout: 10_000,
    maximumAge: 5_000,
  });
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    timestamp: pos.timestamp,
  };
}

export async function watchNativePosition(
  onUpdate: (coords: NativeCoords) => void,
  opts?: { highAccuracy?: boolean },
  deps: NativeGeolocationDeps = PROD_DEPS
): Promise<(() => Promise<void>) | null> {
  if (!deps.isNative()) return null;
  const plugin = await deps.loadPlugin();
  if (!(await ensurePermission(plugin))) return null;

  const highAccuracy = opts?.highAccuracy === true;

  const watchId = await plugin.watchPosition(
    { enableHighAccuracy: highAccuracy, timeout: 15_000 },
    (pos, err) => {
      if (err || !pos) return;
      onUpdate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
    }
  );
  return () => plugin.clearWatch({ id: watchId });
}
