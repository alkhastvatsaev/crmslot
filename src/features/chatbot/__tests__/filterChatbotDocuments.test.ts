import {
  filterChatbotInvoices,
  filterChatbotSupplierOrders,
  mergeChatbotDocumentsByCreatedAt,
  parseDocumentsSearchQuery,
  scoreDocumentSearchToken,
  tokenizeDocumentSearchQuery,
} from "@/features/chatbot/filterChatbotDocuments";
import type { ChatbotInvoiceRow } from "@/features/chatbot/chatbotInvoiceRows";
import type { SupplierOrder } from "@/features/suppliers";

const invoice: ChatbotInvoiceRow = {
  interventionId: "iv-dupont-42",
  clientLabel: "M. Dupont",
  status: "invoiced",
  totalCents: 18500,
  invoicedAt: "2026-05-18T10:00:00.000Z",
  problem: "Porte blindée bloquée",
};

const order: SupplierOrder = {
  id: "ord-lecot-1",
  companyId: "co-1",
  supplierId: "lecot",
  supplierName: "Lecot",
  status: "sent",
  lines: [{ sku: "CYL-YALE", label: "Cylindre Yale", quantity: 2, unitPriceCents: 4500 }],
  totalCents: 9000,
  createdAt: "2026-05-19T10:00:00.000Z",
  updatedAt: "2026-05-19T10:00:00.000Z",
  interventionId: "iv-dupont-42",
};

describe("filterChatbotDocuments", () => {
  it("filters invoices by client and problem tokens", () => {
    const parsed = parseDocumentsSearchQuery("dupont porte");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
    expect(filterChatbotInvoices([invoice], parseDocumentsSearchQuery("yale"))).toHaveLength(0);
  });

  it("limits to invoices when query contains facture hint", () => {
    const parsed = parseDocumentsSearchQuery("facture dupont");
    expect(parsed.kindFilter).toBe("invoice");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
    expect(filterChatbotSupplierOrders([order], parsed)).toHaveLength(0);
  });

  it("limits to orders when query contains commande or lecot hint", () => {
    const parsed = parseDocumentsSearchQuery("lecot cylindre");
    expect(parsed.kindFilter).toBe("order");
    expect(filterChatbotSupplierOrders([order], parsed)).toHaveLength(1);
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(0);
  });

  it("matches supplier order by sku and intervention id", () => {
    const parsed = parseDocumentsSearchQuery("cyl-yale iv-dupont");
    expect(filterChatbotSupplierOrders([order], parsed)).toHaveLength(1);
  });

  it("is accent-insensitive", () => {
    const parsed = parseDocumentsSearchQuery("materiel");
    expect(parsed.kindFilter).toBe("order");
  });

  it("tokenizes quoted phrases as one criterion", () => {
    expect(tokenizeDocumentSearchQuery('"porte bloquee" dupont')).toEqual([
      "porte",
      "bloquee",
      "dupont",
    ]);
  });

  it("strips honorifics from search tokens", () => {
    expect(tokenizeDocumentSearchQuery("M. Dupont")).toEqual(["dupont"]);
  });

  it("matches amount in euros", () => {
    const parsed = parseDocumentsSearchQuery("185");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
    expect(scoreDocumentSearchToken("18500 185 eur", "185,00")).toBeGreaterThan(0);
  });

  it("matches fuzzy typos on client name", () => {
    const parsed = parseDocumentsSearchQuery("dupon");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
  });

  it("matches partial intervention id suffix", () => {
    const parsed = parseDocumentsSearchQuery("dupont-42");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
    expect(filterChatbotSupplierOrders([order], parsed)).toHaveLength(1);
  });

  it("matches date fragments", () => {
    const parsed = parseDocumentsSearchQuery("18/05/2026");
    expect(filterChatbotInvoices([invoice], parsed)).toHaveLength(1);
  });

  it("ranks better matches first", () => {
    const other: ChatbotInvoiceRow = {
      ...invoice,
      interventionId: "iv-other",
      clientLabel: "Martin",
      problem: "Autre",
    };
    const parsed = parseDocumentsSearchQuery("dupont");
    const ranked = filterChatbotInvoices([other, invoice], parsed);
    expect(ranked[0]?.interventionId).toBe("iv-dupont-42");
  });

  it("merges invoices and orders by creation date (newest first)", () => {
    const merged = mergeChatbotDocumentsByCreatedAt([invoice], [order]);
    expect(merged).toHaveLength(2);
    expect(merged[0]?.kind).toBe("order");
    expect(merged[1]?.kind).toBe("invoice");
  });
});
