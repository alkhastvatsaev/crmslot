import { isCapacitorNative } from "./capacitorRuntime";

export type NativeCoords = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export async function getCurrentNativePosition(): Promise<NativeCoords | null> {
  if (!isCapacitorNative()) return null;
  const { Geolocation } = await import("@capacitor/geolocation");
  const perm = await Geolocation.checkPermissions();
  if (perm.location !== "granted") {
    const req = await Geolocation.requestPermissions({ permissions: ["location"] });
    if (req.location !== "granted") return null;
  }
  const pos = await Geolocation.getCurrentPosition({
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
  onUpdate: (coords: NativeCoords) => void
): Promise<(() => Promise<void>) | null> {
  if (!isCapacitorNative()) return null;
  const { Geolocation } = await import("@capacitor/geolocation");

  const perm = await Geolocation.checkPermissions();
  if (perm.location !== "granted") {
    const req = await Geolocation.requestPermissions({ permissions: ["location"] });
    if (req.location !== "granted") return null;
  }

  const watchId = await Geolocation.watchPosition(
    { enableHighAccuracy: true, timeout: 15_000 },
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
  return () => Geolocation.clearWatch({ id: watchId });
}
