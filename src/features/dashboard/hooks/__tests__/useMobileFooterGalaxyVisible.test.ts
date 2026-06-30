import { renderHook } from "@testing-library/react";
import {
  MOBILE_HUB_AGENT_PAGE_INDICES,
  useMobileFooterGalaxyVisible,
  useMobileHubAgentRailActive,
} from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useIsMobile } from "@/features/dashboard/hooks/useIsMobile";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useDashboardPagerOptional } from "@/features/dashboard/dashboardPagerContext";
import { useGalaxyLayerBridgeOptional } from "@/features/map/GalaxyLayerBridgeContext";
import { useMobileHubLayout } from "@/context/LayoutShellContext";
import { useMobileHubRailSnapshot } from "@/features/dashboard/MobileHubRailContext";
import { useHubRailActive } from "@/features/dashboard/hooks/useHubRailActive";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: jest.fn(),
}));

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: jest.fn(),
}));

jest.mock("@/features/dashboard/dashboardPagerContext", () => ({
  useDashboardPagerOptional: jest.fn(),
}));

jest.mock("@/features/map/GalaxyLayerBridgeContext", () => ({
  useGalaxyLayerBridgeOptional: jest.fn(),
}));

jest.mock("@/context/LayoutShellContext", () => ({
  useMobileHubLayout: jest.fn(),
}));

jest.mock("@/features/dashboard/MobileHubRailContext", () => ({
  useMobileHubRailSnapshot: jest.fn(),
}));

jest.mock("@/features/dashboard/hooks/useHubRailActive", () => ({
  useHubRailActive: jest.fn(),
}));

const useIsMobileMock = useIsMobile as jest.MockedFunction<typeof useIsMobile>;
const useFeatureFlagMock = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const usePagerMock = useDashboardPagerOptional as jest.MockedFunction<
  typeof useDashboardPagerOptional
>;
const useBridgeMock = useGalaxyLayerBridgeOptional as jest.MockedFunction<
  typeof useGalaxyLayerBridgeOptional
>;
const useHubLayoutMock = useMobileHubLayout as jest.MockedFunction<typeof useMobileHubLayout>;
const useRailSnapshotMock = useMobileHubRailSnapshot as jest.MockedFunction<
  typeof useMobileHubRailSnapshot
>;
const useHubRailActiveMock = useHubRailActive as jest.MockedFunction<typeof useHubRailActive>;

function mockPager(pageIndex: number) {
  usePagerMock.mockReturnValue({
    pageIndex,
    pageCount: 7,
    setPageIndex: jest.fn(),
    goNext: jest.fn(),
    goPrev: jest.fn(),
  });
}

describe("useMobileHubAgentRailActive", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHubLayoutMock.mockReturnValue(true);
    mockPager(FEATURE_HUB_SLOT_INDEX);
    useRailSnapshotMock.mockReturnValue({
      visible: true,
      activeRail: "left",
      rails: ["left", "center", "right"],
      requestRail: jest.fn(),
    });
    useHubRailActiveMock.mockReturnValue(true);
  });

  it("false hors layout hub mobile", () => {
    useHubLayoutMock.mockReturnValue(false);
    expect(renderHook(() => useMobileHubAgentRailActive()).result.current).toBe(false);
  });

  it("false sur une page sans agent chatbot", () => {
    mockPager(0);
    expect(renderHook(() => useMobileHubAgentRailActive()).result.current).toBe(false);
  });

  it("true sur hub matériel avec rail gauche actif", () => {
    expect(MOBILE_HUB_AGENT_PAGE_INDICES.has(FEATURE_HUB_SLOT_INDEX)).toBe(true);
    expect(renderHook(() => useMobileHubAgentRailActive()).result.current).toBe(true);
  });
});

describe("useMobileFooterGalaxyVisible", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIsMobileMock.mockReturnValue(true);
    useFeatureFlagMock.mockReturnValue(false);
    mockPager(0);
    useBridgeMock.mockReturnValue({
      transcriptionArmed: false,
      armTranscription: jest.fn(),
      disarmTranscription: jest.fn(),
      emitInterventionCreated: jest.fn(),
      registerInterventionConsumer: jest.fn(),
    });
    useHubLayoutMock.mockReturnValue(true);
    useRailSnapshotMock.mockReturnValue({
      visible: true,
      activeRail: "left",
      rails: ["left"],
      requestRail: jest.fn(),
    });
    useHubRailActiveMock.mockReturnValue(true);
  });

  it("false sur desktop", () => {
    useIsMobileMock.mockReturnValue(false);
    expect(renderHook(() => useMobileFooterGalaxyVisible()).result.current).toBe(false);
  });

  it("true sur carte avec dispatch vocal armé", () => {
    useFeatureFlagMock.mockReturnValue(true);
    useBridgeMock.mockReturnValue({
      transcriptionArmed: true,
      armTranscription: jest.fn(),
      disarmTranscription: jest.fn(),
      emitInterventionCreated: jest.fn(),
      registerInterventionConsumer: jest.fn(),
    });

    expect(renderHook(() => useMobileFooterGalaxyVisible()).result.current).toBe(true);
  });

  it("true quand le rail agent hub est actif", () => {
    mockPager(FEATURE_HUB_SLOT_INDEX);
    expect(renderHook(() => useMobileFooterGalaxyVisible()).result.current).toBe(true);
  });

  it("false si le rail gauche n'est pas dans le snapshot", () => {
    mockPager(FEATURE_HUB_SLOT_INDEX);
    useRailSnapshotMock.mockReturnValue({
      visible: true,
      activeRail: "left",
      rails: ["center", "right"],
      requestRail: jest.fn(),
    });
    expect(renderHook(() => useMobileHubAgentRailActive()).result.current).toBe(false);
  });

  it("false si dispatchVoice désactivé même transcription armée", () => {
    useFeatureFlagMock.mockReturnValue(false);
    useBridgeMock.mockReturnValue({
      transcriptionArmed: true,
      armTranscription: jest.fn(),
      disarmTranscription: jest.fn(),
      emitInterventionCreated: jest.fn(),
      registerInterventionConsumer: jest.fn(),
    });
    expect(renderHook(() => useMobileFooterGalaxyVisible()).result.current).toBe(false);
  });

  it("false par défaut (calendrier footer)", () => {
    expect(renderHook(() => useMobileFooterGalaxyVisible()).result.current).toBe(false);
  });
});
