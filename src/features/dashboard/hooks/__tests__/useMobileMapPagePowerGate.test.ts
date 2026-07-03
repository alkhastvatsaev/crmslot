import { renderHook } from "@testing-library/react";
import { useMobileMapPagePowerGate } from "@/features/dashboard/hooks/useMobileMapPagePowerGate";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: jest.fn(),
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: jest.fn(),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailSnapshot: jest.fn(),
}));

const useIsMobileMock = useIsMobile as jest.MockedFunction<typeof useIsMobile>;
const usePagerMock = useDashboardPagerOptional as jest.MockedFunction<
  typeof useDashboardPagerOptional
>;
const useRailMock = useMobileHubRailSnapshot as jest.MockedFunction<
  typeof useMobileHubRailSnapshot
>;

describe("useMobileMapPagePowerGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobileMock.mockReturnValue(true);
    usePagerMock.mockReturnValue({
      pageIndex: 0,
      pageCount: 7,
      setPageIndex: jest.fn(),
      goNext: jest.fn(),
      goPrev: jest.fn(),
    });
    useRailMock.mockReturnValue({
      visible: true,
      activeRail: "left",
      rails: ["left", "center", "right"],
      requestRail: jest.fn(),
    });
  });

  it("desktop — tous les flux carte/inbox restent actifs", () => {
    useIsMobileMock.mockReturnValue(false);

    const { result } = renderHook(() => useMobileMapPagePowerGate());

    expect(result.current).toEqual({
      mapPageVisible: true,
      mapHubDataActive: true,
      mapRenderDataActive: true,
      inboxDataActive: true,
    });
  });

  it("mobile carte rail gauche — WebGL actif, inbox coupé", () => {
    const { result } = renderHook(() => useMobileMapPagePowerGate());

    expect(result.current.mapPageVisible).toBe(true);
    expect(result.current.mapRenderDataActive).toBe(true);
    expect(result.current.mapHubDataActive).toBe(true);
    expect(result.current.inboxDataActive).toBe(false);
  });

  it("mobile autre hub — carte démontée", () => {
    usePagerMock.mockReturnValue({
      pageIndex: 2,
      pageCount: 7,
      setPageIndex: jest.fn(),
      goNext: jest.fn(),
      goPrev: jest.fn(),
    });

    const { result } = renderHook(() => useMobileMapPagePowerGate());

    expect(result.current.mapPageVisible).toBe(false);
    expect(result.current.mapHubDataActive).toBe(false);
    expect(result.current.mapRenderDataActive).toBe(false);
    expect(result.current.inboxDataActive).toBe(false);
  });

  it("mobile rail droit — inbox actif, WebGL coupé", () => {
    useRailMock.mockReturnValue({
      visible: true,
      activeRail: "right",
      rails: ["left", "center", "right"],
      requestRail: jest.fn(),
    });

    const { result } = renderHook(() => useMobileMapPagePowerGate());

    expect(result.current.inboxDataActive).toBe(true);
    expect(result.current.mapRenderDataActive).toBe(false);
  });
});
