import { renderHook } from "@testing-library/react";
import { useHubAnyRailActive, useHubRailActive } from "@/features/dashboard/hooks/useHubRailActive";

const mockUseMobileHubLayout = jest.fn(() => false);
const mockUseMobileHubRailSnapshot = jest.fn(
  (): { activeRail: "left" | "center" | "right" } | null => null
);

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: () => mockUseMobileHubLayout(),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailSnapshot: () => mockUseMobileHubRailSnapshot(),
}));

describe("useHubRailActive", () => {
  beforeEach(() => {
    mockUseMobileHubLayout.mockReturnValue(false);
    mockUseMobileHubRailSnapshot.mockReturnValue(null);
  });

  it("returns true on desktop for any rail", () => {
    const { result } = renderHook(() => useHubRailActive("right"));
    expect(result.current).toBe(true);
  });

  it("follows mobile rail snapshot when mobile shell", () => {
    mockUseMobileHubLayout.mockReturnValue(true);
    mockUseMobileHubRailSnapshot.mockReturnValue({ activeRail: "center" });

    const { result: centerActive } = renderHook(() => useHubRailActive("center"));
    expect(centerActive.current).toBe(true);

    mockUseMobileHubRailSnapshot.mockReturnValue({ activeRail: "left" });
    const { result: centerInactive } = renderHook(() => useHubRailActive("center"));
    expect(centerInactive.current).toBe(false);
  });
});

describe("useHubAnyRailActive", () => {
  beforeEach(() => {
    mockUseMobileHubLayout.mockReturnValue(false);
    mockUseMobileHubRailSnapshot.mockReturnValue(null);
  });

  it("returns true on desktop", () => {
    const { result } = renderHook(() => useHubAnyRailActive(["center", "right"]));
    expect(result.current).toBe(true);
  });

  it("matches any listed rail on mobile", () => {
    mockUseMobileHubLayout.mockReturnValue(true);
    mockUseMobileHubRailSnapshot.mockReturnValue({ activeRail: "right" });

    const { result } = renderHook(() => useHubAnyRailActive(["center", "right"]));
    expect(result.current).toBe(true);
  });
});
