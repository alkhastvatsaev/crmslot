import { renderHook } from "@testing-library/react";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: jest.fn(() => true),
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: jest.fn(() => ({
    pageIndex: 0,
    pageCount: 9,
    setPageIndex: jest.fn(),
  })),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailSnapshot: jest.fn(() => ({
    rails: ["left", "center", "right"],
    activeRail: "center",
    visible: true,
    requestRail: jest.fn(),
  })),
}));

const mockUseIsMobile = jest.requireMock("@/features/dashboard/hooks/useIsMobile")
  .useIsMobile as jest.Mock;
const mockUseDashboardPager = jest.requireMock("@/features/dashboard/dashboardPagerContext")
  .useDashboardPagerOptional as jest.Mock;
const mockUseMobileHubRailSnapshot = jest.requireMock("@/features/dashboard/MobileHubRailContext")
  .useMobileHubRailSnapshot as jest.Mock;

describe("useMobileMapPagePowerGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(true);
    mockUseDashboardPager.mockReturnValue({ pageIndex: 0, pageCount: 9, setPageIndex: jest.fn() });
    mockUseMobileHubRailSnapshot.mockReturnValue({
      rails: ["left", "center", "right"],
      activeRail: "center",
      visible: true,
      requestRail: jest.fn(),
    });
  });

  it("active map hub data sur rail centre", () => {
    const { result } = renderHook(() => useMobileMapPagePowerGate("chat"));
    expect(result.current.mapHubDataActive).toBe(true);
    expect(result.current.mapRenderDataActive).toBe(true);
    expect(result.current.inboxDataActive).toBe(false);
    expect(result.current.documentsTabActive).toBe(false);
  });

  it("active inbox seulement sur rail droit", () => {
    mockUseMobileHubRailSnapshot.mockReturnValue({
      rails: ["left", "center", "right"],
      activeRail: "right",
      visible: true,
      requestRail: jest.fn(),
    });
    const { result } = renderHook(() => useMobileMapPagePowerGate("documents"));
    expect(result.current.inboxDataActive).toBe(true);
    expect(result.current.documentsTabActive).toBe(true);
    expect(result.current.mapHubDataActive).toBe(false);
    expect(result.current.mapRenderDataActive).toBe(false);
  });

  it("coupe tout quand une autre page hub est affichée", () => {
    mockUseDashboardPager.mockReturnValue({ pageIndex: 3, pageCount: 9, setPageIndex: jest.fn() });
    const { result } = renderHook(() => useMobileMapPagePowerGate("documents"));
    expect(result.current.mapPageVisible).toBe(false);
    expect(result.current.mapHubDataActive).toBe(false);
    expect(result.current.inboxDataActive).toBe(false);
  });

  it("laisse tout actif sur desktop", () => {
    mockUseIsMobile.mockReturnValue(false);
    const { result } = renderHook(() => useMobileMapPagePowerGate("chat"));
    expect(result.current.mapHubDataActive).toBe(true);
    expect(result.current.inboxDataActive).toBe(true);
    expect(result.current.mapRenderDataActive).toBe(true);
  });
});
