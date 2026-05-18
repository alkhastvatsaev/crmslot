import { buildChatbotSuggestions } from "@/features/chatbot/buildChatbotSuggestions";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

const baseSnapshot: WorkspaceCopilotSnapshot = {
  generatedAt: new Date().toISOString(),
  locale: "fr",
  company: { id: "co1", name: "Test", role: "admin" },
  summary: {
    totalInterventions: 10,
    byStatus: {},
    urgentOpen: 2,
    awaitingAssignment: 3,
    inProgress: 1,
    doneOrInvoiced: 4,
    unpaidCount: 1,
    paidCount: 2,
    pendingOfflineQueue: 0,
    navigatorOnline: true,
  },
  clients: [],
  interventions: [],
};

describe("buildChatbotSuggestions", () => {
  it("includes urgent count when urgencies exist", () => {
    const labels = buildChatbotSuggestions(baseSnapshot);
    expect(labels.some((l) => l.includes("urgence"))).toBe(true);
  });

  it("falls back when no snapshot", () => {
    expect(buildChatbotSuggestions(null).length).toBeGreaterThan(0);
  });
});
