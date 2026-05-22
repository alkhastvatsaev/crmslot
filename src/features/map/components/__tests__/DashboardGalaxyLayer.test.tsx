"use client";

jest.mock("@/features/map/GalaxyLayerBridgeContext", () => ({
  useGalaxyLayerBridge: () => ({
    transcriptionArmed: false,
    armTranscription: jest.fn(),
    emitInterventionCreated: jest.fn(),
    registerInterventionConsumer: jest.fn(),
  }),
}));

jest.mock("@/features/map/components/MapGalaxyTranscriptionLayer", () => ({
  __esModule: true,
  default: () => <div data-testid="map-galaxy-transcription-mock" />,
}));

jest.mock("@/features/chatbot/components/ChatbotGalaxyComposer", () => ({
  __esModule: true,
  default: () => <div data-testid="chatbot-galaxy-composer" />,
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

import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";
import { CRM_HISTORY_SLOT_INDEX } from "@/features/crmHistory/crmHistoryConstants";
import { BILLING_HUB_SLOT_INDEX } from "@/features/billingHub/billingHubConstants";

describe("DashboardGalaxyLayer", () => {
  it("shows stock composer on material page", () => {
    render(
      <DashboardPagerProvider pageCount={7} initialPageIndex={FEATURE_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.getByTestId("company-stock-galaxy-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-galaxy-composer")).not.toBeInTheDocument();
  });

  it("shows CRM history composer on history page", () => {
    render(
      <DashboardPagerProvider pageCount={7} initialPageIndex={CRM_HISTORY_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.getByTestId("crm-history-galaxy-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-galaxy-composer")).not.toBeInTheDocument();
  });

  it("shows billing composer on billing page", () => {
    render(
      <DashboardPagerProvider pageCount={7} initialPageIndex={BILLING_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.getByTestId("billing-hub-galaxy-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-galaxy-composer")).not.toBeInTheDocument();
  });

  it("shows no agent composer on map page", () => {
    render(
      <DashboardPagerProvider pageCount={7} initialPageIndex={0}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.queryByTestId("chatbot-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-galaxy-composer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("billing-hub-galaxy-composer")).not.toBeInTheDocument();
  });
});
