import {
  extractChatbotClientQuery,
  matchInterventionInSnapshot,
  parseChatbotEuroAmount,
  resolveChatbotPwaIntent,
  buildChatbotPwaDoneMessage,
  isChatbotPwaPendingToolId,
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

  describe("Branch and edge case coverage", () => {
    it("parseChatbotEuroAmount returns null for invalid amounts", () => {
      expect(parseChatbotEuroAmount("pas de prix")).toBeNull();
      expect(parseChatbotEuroAmount("0 €")).toBeNull();
    });

    it("extractChatbotClientQuery handles different patterns", () => {
      expect(extractChatbotClientQuery("dossier de Dupont")).toMatch(/dupont/i);
      expect(extractChatbotClientQuery("client Martin")).toMatch(/martin/i);
      expect(extractChatbotClientQuery("facture")).toBeNull(); // too short or blacklisted
    });

    it("matchInterventionInSnapshot handles empty/null inputs", () => {
      expect(matchInterventionInSnapshot(null, "Vatsaev")).toBeNull();
      expect(matchInterventionInSnapshot(snapshot, "")).toBeNull();
      expect(matchInterventionInSnapshot(snapshot, "x")).toBeNull(); // too short
    });

    it("matchInterventionInSnapshot handles partial matches", () => {
      // Partial word match via splitting
      const m = matchInterventionInSnapshot(snapshot, "monsieur toto vats");
      expect(m?.interventionId).toBe("int-vatsaev");
    });

    it("resolveChatbotPwaIntent handles missing intervention", () => {
      expect(resolveChatbotPwaIntent("facture inconnu à 500€", null)).toBeNull();
    });

    it("resolveChatbotPwaIntent create-invoice phrase opens invoice PDF", () => {
      const intent = resolveChatbotPwaIntent("Fait une facture pour monsieur Vatsaev", snapshot);
      expect(intent?.kind).toBe("document_preview");
      if (intent?.kind === "document_preview") {
        expect(intent.documentType).toBe("invoice");
        expect(intent.intervention.interventionId).toBe("int-vatsaev");
      }
    });

    it("resolveChatbotPwaIntent handles line index", () => {
      const intent = resolveChatbotPwaIntent("met la ligne 2 a 500€", snapshot, { focusInterventionId: "int-vatsaev" });
      expect(intent?.kind).toBe("billing_patch");
      if (intent?.kind === "billing_patch") {
        expect(intent.lineIndex).toBe(1); // zero-indexed
      }
    });

    it("isChatbotPwaPendingToolId", () => {
      expect(isChatbotPwaPendingToolId("pwa_123")).toBe(true);
      expect(isChatbotPwaPendingToolId("call_456")).toBe(false);
    });

    it("buildChatbotPwaDoneMessage formats messages correctly", () => {
      const intentPatch = resolveChatbotPwaIntent("facture Vatsaev 500€", snapshot)!;
      expect(buildChatbotPwaDoneMessage(intentPatch)).toContain("500 €");
      
      const intentPreview = resolveChatbotPwaIntent("affiche devis Vatsaev", snapshot)!;
      expect(buildChatbotPwaDoneMessage(intentPreview)).toContain("Devis");

      const intentAdd = resolveChatbotPwaIntent("ajoute serrure a 100€", snapshot, { focusInterventionId: "int-vatsaev" })!;
      expect(buildChatbotPwaDoneMessage(intentAdd)).toContain("Lignes ajoutées");
    });
  });
});
