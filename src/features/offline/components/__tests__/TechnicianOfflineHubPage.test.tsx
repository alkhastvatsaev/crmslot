import { screen } from "@testing-library/react";
import { render } from "@/test-utils/render";
import TechnicianOfflineHubPage from "@/features/offline/components/TechnicianOfflineHubPage";
import { OFFLINE_HUB_SLOT_INDEX } from "@/features/offline/offlineHubConstants";

jest.mock("@/features/copilot/hooks/useWorkspaceCopilotSnapshot", () => ({
  useWorkspaceCopilotSnapshot: () => ({
    loading: false,
    snapshot: {
      generatedAt: "2026-01-01T00:00:00.000Z",
      locale: "fr",
      company: { id: "demo-co", name: "Demo SA", role: "admin" },
      summary: {
        totalInterventions: 5,
        byStatus: { pending: 2 },
        urgentOpen: 1,
        awaitingAssignment: 2,
        inProgress: 1,
        doneOrInvoiced: 2,
        unpaidCount: 1,
        paidCount: 1,
        pendingOfflineQueue: 0,
        navigatorOnline: true,
      },
      clients: [{ name: "Alice", phone: null, interventionCount: 3 }],
      interventions: [],
    },
  }),
}));

describe("TechnicianOfflineHubPage", () => {
  it("renders PWA copilot chat with context rails", () => {
    render(<TechnicianOfflineHubPage slotIndex={OFFLINE_HUB_SLOT_INDEX} />, { pageCount: 6 });
    expect(screen.getByTestId("pwa-copilot-chat-panel")).toBeInTheDocument();
    expect(screen.getByTestId("pwa-copilot-context-summary")).toBeInTheDocument();
    expect(screen.getByTestId("pwa-copilot-suggestions")).toBeInTheDocument();
    expect(screen.getByTestId("pwa-copilot-stat-total")).toHaveTextContent("5");
    expect(screen.queryByTestId("technician-offline-sync-panel")).not.toBeInTheDocument();
  });
});
