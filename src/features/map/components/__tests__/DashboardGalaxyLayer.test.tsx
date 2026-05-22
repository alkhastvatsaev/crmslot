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

import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import DashboardGalaxyLayer from "@/features/map/components/DashboardGalaxyLayer";
import { DashboardPagerProvider } from "@/features/dashboard/dashboardPagerContext";
import { FEATURE_HUB_SLOT_INDEX } from "@/features/featureHub/featureHubConstants";

describe("DashboardGalaxyLayer", () => {
  it("shows stock composer on material page", () => {
    render(
      <DashboardPagerProvider pageCount={8} initialPageIndex={FEATURE_HUB_SLOT_INDEX}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.getByTestId("company-stock-galaxy-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("chatbot-galaxy-composer")).not.toBeInTheDocument();
  });

  it("shows chatbot composer on other pages", () => {
    render(
      <DashboardPagerProvider pageCount={8} initialPageIndex={0}>
        <DashboardGalaxyLayer />
      </DashboardPagerProvider>,
    );
    expect(screen.getByTestId("chatbot-galaxy-composer")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-galaxy-composer")).not.toBeInTheDocument();
  });
});
