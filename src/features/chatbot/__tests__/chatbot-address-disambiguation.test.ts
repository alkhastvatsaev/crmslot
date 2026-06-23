import {
  buildPendingInterventionIdsFromAssistant,
  extractInterventionIdFromInvoiceReply,
  extractNumberedAddressLines,
  findClientQueryFromConversation,
  isAddressDisambiguationPrompt,
  listInterventionsForClientQuery,
  mapNumberedAddressesToInterventionIds,
  parseNumericChoiceIndex,
  resolveNumericInterventionChoice,
  shouldAutoPreviewInvoiceInPanel,
} from "@/features/chatbot/chatbot-address-disambiguation";
import type { WorkspaceCopilotSnapshot } from "@/features/copilot";

const snapshot: WorkspaceCopilotSnapshot = {
  generatedAt: "2026-05-18T10:00:00Z",
  locale: "fr",
  company: { id: "co1", name: "Demo", role: "admin" },
  summary: {
    totalInterventions: 3,
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
      id: "iv-1",
      title: "A",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "9 rue du Lombard",
      problem: null,
      scheduled: null,
      paymentStatus: "unpaid",
      invoiceAmountEur: 100,
      urgency: false,
      hasAudio: false,
      hasInvoicePdf: true,
      clientEmail: null,
    },
    {
      id: "iv-2",
      title: "B",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "Rue de la Fourche 9, 1000 Bruxelles",
      problem: null,
      scheduled: null,
      paymentStatus: "unpaid",
      invoiceAmountEur: 350,
      urgency: false,
      hasAudio: false,
      hasInvoicePdf: true,
      clientEmail: null,
    },
    {
      id: "iv-3",
      title: "C",
      status: "done",
      clientName: "Monsieur Vatsaev",
      address: "17 Rue Sénèque, 07200 Strasbourg",
      problem: null,
      scheduled: null,
      paymentStatus: "unpaid",
      invoiceAmountEur: 200,
      urgency: false,
      hasAudio: false,
      hasInvoicePdf: true,
      clientEmail: null,
    },
  ],
};

const disambiguationAssistant = `Il semble que plusieurs interventions soient associées à Monsieur Vatsaev.
1. 9 rue du Lombard
2. Rue de la Fourche 9, 1000 Bruxelles
3. 17 Rue Sénèque, 07200 Strasbourg
Pour laquelle de ces adresses souhaitez-vous créer une facture ?`;

describe("chatbot-address-disambiguation", () => {
  it("extracts numbered addresses", () => {
    const lines = extractNumberedAddressLines(disambiguationAssistant);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("Fourche");
  });

  it("detects disambiguation prompt", () => {
    expect(isAddressDisambiguationPrompt(disambiguationAssistant)).toBe(true);
  });

  it("maps addresses to intervention ids", () => {
    const lines = extractNumberedAddressLines(disambiguationAssistant);
    const ids = mapNumberedAddressesToInterventionIds(snapshot, lines, "Vatsaev");
    expect(ids[1]).toBe("iv-2");
  });

  it("extracts at least two numbered address lines", () => {
    const assistant = `1. 9 rue du Lombard\n2. Rue de la Fourche 9, 1000 Bruxelles\nPour laquelle de ces adresses souhaitez-vous créer une facture ?`;
    expect(extractNumberedAddressLines(assistant).length).toBeGreaterThanOrEqual(2);
  });

  it("maps two-address list to intervention ids", () => {
    const assistant = `1. 9 rue du Lombard\n2. Rue de la Fourche 9, 1000 Bruxelles\nPour laquelle de ces adresses souhaitez-vous créer une facture ?`;
    const lines = extractNumberedAddressLines(assistant);
    const ids = mapNumberedAddressesToInterventionIds(snapshot, lines, "Vatsaev");
    expect(ids.length).toBeGreaterThanOrEqual(2);
    expect(ids[1]).toBe("iv-2");
  });

  it("finds client query in conversation", () => {
    expect(
      findClientQueryFromConversation([
        { role: "user", content: "facture monsieur vatsaev" },
        { role: "assistant", content: "1. test" },
      ])
    ).toMatch(/vatsaev/i);
  });

  it("resolves numeric choice with two-address list", () => {
    const assistant = `1. 9 rue du Lombard\n2. Rue de la Fourche 9, 1000 Bruxelles\nPour laquelle de ces adresses souhaitez-vous créer une facture ?`;
    const choice = resolveNumericInterventionChoice(
      "2",
      snapshot,
      [
        { role: "user", content: "facture monsieur vatsaev" },
        { role: "assistant", content: assistant },
      ],
      null
    );
    expect(choice?.interventionId).toBe("iv-2");
  });

  it("resolves numeric user choice 2", () => {
    const choice = resolveNumericInterventionChoice(
      "2",
      snapshot,
      [
        { role: "user", content: "facture monsieur vatsaev" },
        { role: "assistant", content: disambiguationAssistant },
      ],
      null
    );
    expect(choice?.interventionId).toBe("iv-2");
  });

  it("should auto-preview when invoice already exists", () => {
    expect(
      shouldAutoPreviewInvoiceInPanel(
        "La facture pour l'intervention de Monsieur Vatsaev à la Rue de la Fourche 9 est déjà créée avec un total de 350 €."
      )
    ).toBe(true);
  });

  it("parseNumericChoiceIndex rejects invalid choices", () => {
    expect(parseNumericChoiceIndex("")).toBeNull();
    expect(parseNumericChoiceIndex("abc")).toBeNull();
    expect(parseNumericChoiceIndex("21")).toBeNull();
    expect(parseNumericChoiceIndex("2")).toBe(2);
  });

  it("listInterventionsForClientQuery returns sorted client rows", () => {
    const rows = listInterventionsForClientQuery(snapshot, "Vatsaev");
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.interventionId).sort()).toEqual(["iv-1", "iv-2", "iv-3"]);
  });

  it("buildPendingInterventionIdsFromAssistant returns ids for disambiguation reply", () => {
    const ids = buildPendingInterventionIdsFromAssistant(disambiguationAssistant, snapshot, [
      { role: "user", content: "facture monsieur vatsaev" },
    ]);
    expect(ids).toEqual(["iv-1", "iv-2", "iv-3"]);
  });

  it("extractInterventionIdFromInvoiceReply matches address in assistant text", () => {
    const id = extractInterventionIdFromInvoiceReply(
      "Facture pour Monsieur Vatsaev — Rue de la Fourche 9, 1000 Bruxelles — total 350 €.",
      snapshot,
      [{ role: "user", content: "facture monsieur vatsaev" }]
    );
    expect(id).toBe("iv-2");
  });

  it("resolveNumericInterventionChoice uses pendingInterventionIds when provided", () => {
    const choice = resolveNumericInterventionChoice("2", snapshot, [], ["iv-a", "iv-b"]);
    expect(choice?.interventionId).toBe("iv-b");
  });
});
