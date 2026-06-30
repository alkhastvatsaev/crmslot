import { renderHook } from "@testing-library/react";
import { useMobileHubAgentRailActive } from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

const mockUseMobileHubLayout = jest.fn(() => true);
const mockUseDashboardPagerOptional = jest.fn(() => ({ pageIndex: FEATURE_HUB_SLOT_INDEX }));
const mockUseMobileHubRailSnapshot = jest.fn(() => ({
  rails: ["left", "center", "right"] as const,
  activeRail: "left" as const,
  visible: true,
  requestRail: jest.fn(),
}));

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: () => mockUseMobileHubLayout(),
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: () => mockUseDashboardPagerOptional(),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailSnapshot: () => mockUseMobileHubRailSnapshot(),
}));

jest.mock("@/features/dashboard/hooks/useHubRailActive", () => ({
  useHubRailActive: (rail: string) => {
    const snapshot = mockUseMobileHubRailSnapshot();
    return snapshot?.activeRail === rail;
  },
}));

describe("useMobileHubAgentRailActive", () => {
  beforeEach(() => {
    mockUseMobileHubLayout.mockReturnValue(true);
    mockUseDashboardPagerOptional.mockReturnValue({ pageIndex: FEATURE_HUB_SLOT_INDEX });
    mockUseMobileHubRailSnapshot.mockReturnValue({
      rails: ["left", "center", "right"],
      activeRail: "left",
      visible: true,
      requestRail: jest.fn(),
    });
  });

  it("returns false on desktop shell", () => {
    mockUseMobileHubLayout.mockReturnValue(false);
    const { result } = renderHook(() => useMobileHubAgentRailActive());
    expect(result.current).toBe(false);
  });

  it("returns true when agent rail left is active on material hub", () => {
    const { result } = renderHook(() => useMobileHubAgentRailActive());
    expect(result.current).toBe(true);
  });
});
