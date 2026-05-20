import {
  extractChatbotClientQuery,
  matchInterventionInSnapshot,
  parseChatbotEuroAmount,
  resolveChatbotPwaIntent,
} from "@/features/chatbot/chatbot-pwa-intent";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot/types";

const snapshot: WorkspaceCopilotSnapshot = {
  generatedAt: "2026-05-18T10:00:00Z",
  locale: "fr",
  company: { id: "co1", name: "Demo", role: "admin" },
  summary: {
    totalInterventions: 1,
    byStatus: {},
    urgentOpen: 0,
    awaitingAssignment: 0,
    inProgress: 0,
    doneOrInvoiced: 0,
    unpaidCount: 0,
    paidCount: 0,
    pendingOfflineQueue: 0,
    navigatorOnline: true,
  },
  clients: [],
  interventions: [
    {
      id: "int-vatsaev",
      title: "Porte",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "Bruxelles",
      problem: null,
      scheduled: null,
      paymentStatus: "unpaid",
      invoiceAmountEur: 120,
      urgency: false,
      hasAudio: false,
      hasInvoicePdf: true,
      clientEmail: null,
    },
  ],
};

describe("chatbot-pwa-intent", () => {
  it("parseChatbotEuroAmount", () => {
    expect(parseChatbotEuroAmount("500 €")).toBe(500);
    expect(parseChatbotEuroAmount("prix à 120,50 euros")).toBe(120.5);
  });

  it("extractChatbotClientQuery", () => {
    expect(extractChatbotClientQuery("facture monsieur Vatsaev 500€")).toMatch(/vatsaev/i);
  });

  it("matchInterventionInSnapshot", () => {
    const m = matchInterventionInSnapshot(snapshot, "Vatsaev");
    expect(m?.interventionId).toBe("int-vatsaev");
  });

  it("resolveChatbotPwaIntent billing_patch", () => {
    const intent = resolveChatbotPwaIntent("Mets la facture de monsieur Vatsaev à 500 €", snapshot);
    expect(intent?.kind).toBe("billing_patch");
    if (intent?.kind === "billing_patch") {
      expect(intent.unitPriceEur).toBe(500);
      expect(intent.intervention.interventionId).toBe("int-vatsaev");
    }
  });

  it("resolveChatbotPwaIntent billing_add_lines", () => {
    const intent = resolveChatbotPwaIntent(
      "ajoute une serrure a 300€ et main d'oeuvre 50€",
      snapshot,
      { focusInterventionId: "int-vatsaev" },
    );
    expect(intent?.kind).toBe("billing_add_lines");
    if (intent?.kind === "billing_add_lines") {
      expect(intent.lines).toHaveLength(2);
    }
  });

  it("resolveChatbotPwaIntent document_preview for affiche le pdf with focus dossier", () => {
    const intent = resolveChatbotPwaIntent("affiche le pdf", snapshot, {
      focusInterventionId: "iv-vatsaev",
    });
    expect(intent?.kind).toBe("document_preview");
    expect(intent && intent.kind === "document_preview" ? intent.documentType : null).toBe(
      "invoice",
    );
  });

  it("resolveChatbotPwaIntent document_preview", () => {
    const intent = resolveChatbotPwaIntent("Affiche la facture de Vatsaev", snapshot);
    expect(intent?.kind).toBe("document_preview");
  });
});
