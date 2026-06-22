import { renderHook } from "@testing-library/react";
import { useGeofenceMonitor } from "@/features/geofence/useGeofenceMonitor";
import type { Intervention } from "@/features/interventions/types";

type WatchArgs = [PositionCallback, PositionErrorCallback | undefined, PositionOptions | undefined];
const mockWatchPosition = jest.fn<number, WatchArgs>(() => 42);
const mockClearWatch = jest.fn<void, [number]>();

beforeAll(() => {
  Object.defineProperty(global.navigator, "geolocation", {
    value: { watchPosition: mockWatchPosition, clearWatch: mockClearWatch },
    configurable: true,
  });
});

describe("useGeofenceMonitor — consommation énergie", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("n'appelle pas watchPosition quand enabled=false", () => {
    renderHook(() => useGeofenceMonitor([], { enabled: false }));
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  it("n'appelle pas watchPosition sans mission assignée/en route", () => {
    renderHook(() => useGeofenceMonitor([], { enabled: true }));
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });

  it("appelle watchPosition pour une mission assignée avec coordonnées", () => {
    const mission = {
      id: "m1",
      status: "assigned",
      location: { lat: 50.8, lng: 4.3 },
    } as Intervention;
    renderHook(() => useGeofenceMonitor([mission], { enabled: true }));
    expect(mockWatchPosition).toHaveBeenCalled();
    const opts = mockWatchPosition.mock.calls[0]?.[2];
    expect(opts?.enableHighAccuracy).toBe(false);
  });

  it("nettoie le watch à l'unmount (pas de GPS zombie)", () => {
    const mission = {
      id: "m1",
      status: "en_route",
      location: { lat: 50.8, lng: 4.3 },
    } as Intervention;
    const { unmount } = renderHook(() => useGeofenceMonitor([mission], { enabled: true }));
    unmount();
    expect(mockClearWatch).toHaveBeenCalledWith(42);
  });

  it("ne redémarre pas watchPosition si les missions changent mais enabled reste false", () => {
    const mission = {
      id: "m1",
      status: "assigned",
      location: { lat: 50.8, lng: 4.3 },
    } as Intervention;
    const { rerender } = renderHook(
      ({ missions }: { missions: Intervention[] }) =>
        useGeofenceMonitor(missions, { enabled: false }),
      { initialProps: { missions: [] as Intervention[] } }
    );
    rerender({ missions: [mission] });
    expect(mockWatchPosition).not.toHaveBeenCalled();
  });
});

describe("useGeofenceMonitor — geofenceAuto false par défaut", () => {
  it("la valeur par défaut de geofenceAuto empêche le GPS (régression batterie)", async () => {
    const { featureFlagsFromEnv } = await import("@/core/featureFlags");
    const flags = featureFlagsFromEnv();
    // geofenceAuto: false = GPS éteint par défaut → pas de -30% batterie
    expect(flags.geofenceAuto).toBe(false);
  });
});
