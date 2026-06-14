import { renderHook } from "@testing-library/react";
import { useGeofenceMonitor } from "@/features/geofence/useGeofenceMonitor";
import type { Intervention } from "@/features/interventions/types";

const mockWatchPosition = jest.fn(() => 42);
const mockClearWatch = jest.fn();

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

  it("appelle watchPosition avec enableHighAccuracy quand enabled=true", () => {
    renderHook(() => useGeofenceMonitor([], { enabled: true }));
    expect(mockWatchPosition).toHaveBeenCalledTimes(1);
    const opts = mockWatchPosition.mock.calls[0][2];
    expect(opts.enableHighAccuracy).toBe(true);
  });

  it("nettoie le watch à l'unmount (pas de GPS zombie)", () => {
    const { unmount } = renderHook(() => useGeofenceMonitor([], { enabled: true }));
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
      { initialProps: { missions: [] } }
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
