"use client";

jest.mock("@/features/map/GalaxyLayerBridgeContext", () => ({
  useGalaxyLayerBridge: () => ({
    transcriptionArmed: false,
    armTranscription: jest.fn(),
    emitInterventionCreated: jest.fn(),
    registerInterventionConsumer: jest.fn(),
  }),
}));

const mapGalaxyTranscriptionProps: { hideDockStrip?: boolean }[] = [];

jest.mock("@/features/dashboard/hooks/useIsMobile", () => ({
  useIsMobile: jest.fn(() => false),
}));

jest.mock("@/features/map/components/MapGalaxyTranscriptionLayer", () => ({
  __esModule: true,
  default: (props: { hideDockStrip?: boolean }) => {
    mapGalaxyTranscriptionProps.push(props);
    return <div data-testid="map-galaxy-transcription-mock" />;
  },
}));

jest.mock("@/features/featureHub/components/CompanyStockGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="company-stock-galaxy-composer" />,
}));

jest.mock("@/features/crmHistory/components/CrmHistoryGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="crm-history-galaxy-composer" />,
}));

jest.mock("@/features/billingHub/components/BillingHubGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="billing-hub-galaxy-composer" />,
}));

jest.mock("@/features/copilot/components/PwaCopilotGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="pwa-copilot-galaxy-composer" />,
}));

import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";
import { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";

describe("DashboardGalaxyLayer", () => {
  beforeEach(() => {
    mapGalaxyTranscriptionProps.length = 0;
  });

  it("shows stock composer on material page", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={FEATURE_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.getByTestId("company-stock-galaxy-composer")).toBeInTheDocument();
  });

  it("shows CRM history composer on history page", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={CRM_HISTORY_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.getByTestId("crm-history-galaxy-composer")).toBeInTheDocument();
  });

  it("shows billing composer on billing page", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={BILLING_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.getByTestId("billing-hub-galaxy-composer")).toBeInTheDocument();
  });

  it("shows copilot composer on assistant IA page", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={OFFLINE_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.getByTestId("pwa-copilot-galaxy-composer")).toBeInTheDocument();
  });

  it("shows no agent composer on map page and keeps map galaxy dock", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={0}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.queryByTestId("company-stock-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("crm-history-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-hub-galaxy-composer")).not.toBeInTheDocument();
    expect(mapGalaxyTranscriptionProps.at(-1)?.hideDockStrip).toBe(false);
  });

  it("shows no agent composer on Gmail page", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={4}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(screen.queryByTestId("company-stock-galaxy-composer")).not.toBeInTheDocument();
    expect(mapGalaxyTranscriptionProps.at(-1)?.hideDockStrip).toBe(false);
  });

  it("hides map dock strip when a page composer is shown", () => {
    render(
      <DashboardPagerProvider pageCount={6} initialPageIndex={FEATURE_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>
    );
    expect(mapGalaxyTranscriptionProps.at(-1)?.hideDockStrip).toBe(true);
  });
});
