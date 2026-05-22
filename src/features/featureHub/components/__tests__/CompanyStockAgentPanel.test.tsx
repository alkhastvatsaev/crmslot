"use client";

import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { ChatbotStreamEvent } from "@/features/chatbot/chatbot-types";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

const mockFetchWithAuth = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

function streamResponse(events: ChatbotStreamEvent[]): Response {
  const payload = `${events.map((e) => JSON.stringify(e)).join("\n")}\n`;
  const bytes = Uint8Array.from(Buffer.from(payload, "utf-8"));
  let consumed = false;
  const body = {
    getReader: () => ({
      read: async () => {
        if (consumed) return { done: true as const, value: undefined };
        consumed = true;
        return { done: false as const, value: bytes };
      },
      releaseLock: () => {},
    }),
  };
  return { ok: true, status: 200, body } as Response;
}

jest.mock("@/core/ui/GalaxyButton/GalaxyButton", () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="galaxy-button-mock">{children}</div>
  ),
}));

import { screen, fireEvent, waitFor } from "@testing-library/react";
import { render } from "@/test-utils/render";
import CompanyStockAgentPanel from "@/features/featureHub/components/CompanyStockAgentPanel";
import CompanyStockGalaxyComposer from "@/features/featureHub/components/CompanyStockGalaxyComposer";
import { CompanyStockAgentBridgeProvider } from "@/context/CompanyStockAgentBridgeContext";
import { CompanyStockIntentProvider } from "@/context/CompanyStockIntentContext";
import { computeCompanyStockMetrics } from "@/features/featureHub/companyStockMetrics";
import type { StockItem } from "@/features/materials/stockFirestore";

const items: StockItem[] = [
  {
    id: "s1",
    companyId: "co",
    reference: "R1",
    description: "Test",
    quantity: 1,
    alertThreshold: 5,
    unit: "pcs",
    updatedAt: "2026-05-01",
  },
];

function renderAgentUi(pageActive = true) {
  const metrics = computeCompanyStockMetrics(items, [], [], 0);
  return render(
    <CompanyStockAgentBridgeProvider>
      <CompanyStockIntentProvider>
        <>
          <CompanyStockAgentPanel
            ctx={{ companyId: "co", items, orders: [], metrics }}
            pageActive={pageActive}
          />
          <CompanyStockGalaxyComposer />
        </>
      </CompanyStockIntentProvider>
    </CompanyStockAgentBridgeProvider>,
  );
}

describe("CompanyStockAgentPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithAuth.mockResolvedValue(
      streamResponse([
        { type: "text", delta: "1 article en rupture." },
        { type: "done", apiMessages: [{ role: "assistant", content: "1 article en rupture." }] },
      ]),
    );
  });

  it("shows galaxy orb on empty chat (like chatbot page)", async () => {
    renderAgentUi();
    expect(screen.getByTestId("chatbot-galaxy-orb")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-agent-msg-assistant")).not.toBeInTheDocument();
  });

  it("renders messages only; galaxy dock sends to agent", async () => {
    renderAgentUi();
    expect(screen.getByTestId("company-stock-agent-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("company-stock-agent-input")).not.toBeInTheDocument();
    expect(screen.getByTestId("company-stock-galaxy-input")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("company-stock-agent-messages")).toBeInTheDocument();
    });

    const input = screen.getByTestId("company-stock-galaxy-input");
    fireEvent.change(input, { target: { value: "ruptures" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText(/1 article en rupture/i)).toBeInTheDocument();
    });
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      "/api/ai/material-agent",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("refuses off-topic question via galaxy input", async () => {
    renderAgentUi();
    await waitFor(() => screen.getByTestId("company-stock-galaxy-input"));

    const input = screen.getByTestId("company-stock-galaxy-input");
    fireEvent.change(input, { target: { value: "envoie la facture par gmail" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });

    await waitFor(() => {
      expect(screen.getByText(/Assistant IA/i)).toBeInTheDocument();
    });
    expect(mockFetchWithAuth).not.toHaveBeenCalled();
  });

  it("shows + in galaxy dock to reset conversation", async () => {
    renderAgentUi();
    await waitFor(() => screen.getByTestId("company-stock-agent-new-conversation"));

    const input = screen.getByTestId("company-stock-galaxy-input");
    fireEvent.change(input, { target: { value: "ruptures" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: false });
    await waitFor(() => screen.getByText(/1 article en rupture/i));

    fireEvent.click(screen.getByTestId("company-stock-agent-new-conversation"));
    await waitFor(() => {
      expect(screen.getByTestId("chatbot-galaxy-orb")).toBeInTheDocument();
      expect(screen.queryByText(/1 article en rupture/i)).not.toBeInTheDocument();
    });
  });

  it("unregisters galaxy handlers when page inactive", async () => {
    renderAgentUi(false);
    await waitFor(() => screen.getByTestId("company-stock-galaxy-input"));
    expect(screen.getByTestId("company-stock-galaxy-input")).toBeDisabled();
  });
});
