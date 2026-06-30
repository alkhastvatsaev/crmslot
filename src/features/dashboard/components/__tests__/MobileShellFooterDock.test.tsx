import { render, screen } from "@/test-utils/render";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import MobileShellFooterDock from "@/features/dashboard/components/MobileShellFooterDock";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import * as mobileFooterGalaxyVisible from "@/features/dashboard/hooks/useMobileFooterGalaxyVisible";
import { useFeatureFlag } from "@/core/useFeatureFlags";
import { useGalaxyLayerBridge } from "@/features/map/GalaxyLayerBridgeContext";

jest.mock("@/features/dashboard/hooks/useMobileFooterGalaxyVisible", () => ({
  useMobileFooterGalaxyVisible: jest.fn(() => false),
  useMobileHubAgentRailActive: jest.fn(() => false),
}));

jest.mock("@/core/useFeatureFlags", () => ({
  useFeatureFlag: jest.fn(() => false),
}));

jest.mock("@/features/map/GalaxyLayerBridgeContext", () => ({
  useGalaxyLayerBridge: jest.fn(),
}));

jest.mock("@/features/map/components/MapGalaxyTranscriptionLayer", () => ({
  __esModule: true,
  default: ({
    hideDockStrip,
    backgroundTasksEnabled,
  }: {
    hideDockStrip?: boolean;
    backgroundTasksEnabled?: boolean;
  }) => (
    <div
      data-testid="map-galaxy-transcription"
      data-hide-dock={hideDockStrip ? "true" : "false"}
      data-background-tasks={backgroundTasksEnabled ? "true" : "false"}
    />
  ),
}));

jest.mock("@/features/featureHub/components/CompanyStockGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="stock-galaxy-composer" />,
}));

jest.mock("@/features/crmHistory/components/CrmHistoryGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="crm-galaxy-composer" />,
}));

jest.mock("@/features/billingHub/components/BillingHubGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="billing-galaxy-composer" />,
}));

const useFeatureFlagMock = useFeatureFlag as jest.MockedFunction<typeof useFeatureFlag>;
const useGalaxyLayerBridgeMock = useGalaxyLayerBridge as jest.MockedFunction<
  typeof useGalaxyLayerBridge
>;

function renderFooterDock(initialPageIndex = 0) {
  return render(
    <DashboardPagerProvider pageCount={7} initialPageIndex={initialPageIndex}>
      <MobileShellFooterDock />
    </DashboardPagerProvider>
  );
}

describe("MobileShellFooterDock", () => {
  beforeEach(() => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(false);
    useFeatureFlagMock.mockReturnValue(false);
    useGalaxyLayerBridgeMock.mockReturnValue({
      transcriptionArmed: false,
      armTranscription: jest.fn(),
      disarmTranscription: jest.fn(),
      emitInterventionCreated: jest.fn(),
      registerInterventionConsumer: jest.fn(),
    });
  });

  it("ne monte pas la couche carte ni les composers hub quand Galaxy est masqué", () => {
    renderFooterDock();

    expect(screen.queryByTestId("map-galaxy-transcription")).not.toBeInTheDocument();
    expect(screen.queryByTestId("stock-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("crm-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-galaxy-composer")).not.toBeInTheDocument();
  });

  it("affiche le dock dispatch carte quand dispatchVoice + Galaxy visible sur la carte", () => {
    useFeatureFlagMock.mockReturnValue(true);
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);

    renderFooterDock(0);

    const layer = screen.getByTestId("map-galaxy-transcription");
    expect(layer).toHaveAttribute("data-hide-dock", "false");
    expect(layer).toHaveAttribute("data-background-tasks", "true");
    expect(screen.queryByTestId("stock-galaxy-composer")).not.toBeInTheDocument();
  });

  it.each([
    [FEATURE_HUB_SLOT_INDEX, "stock-galaxy-composer"],
    [CRM_HISTORY_SLOT_INDEX, "crm-galaxy-composer"],
    [BILLING_HUB_SLOT_INDEX, "billing-galaxy-composer"],
  ] as const)("monte le composer hub sur la page %i", (pageIndex, composerTestId) => {
    jest.mocked(mobileFooterGalaxyVisible.useMobileFooterGalaxyVisible).mockReturnValue(true);

    renderFooterDock(pageIndex);

    expect(screen.getByTestId(composerTestId)).toBeInTheDocument();
    expect(screen.queryByTestId("map-galaxy-transcription")).not.toBeInTheDocument();
  });
});
