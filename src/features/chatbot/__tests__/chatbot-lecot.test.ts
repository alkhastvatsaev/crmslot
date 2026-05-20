import {
  extractLecotProductQueryFromFollowUp,
  formatLecotSearchReplyForChat,
  orderLecotPartsForChatbot,
  searchLecotProductsForChatbot,
  tryLecotProductFollowUpIntent,
} from "@/features/chatbot/chatbot-lecot";
import { submitLecotSupplierOrder } from "@/features/catalog/lecotSupplierOrder";
import { searchLecotViaApi } from "@/features/catalog/lecotApiSearch";
import { loadCompanyCatalogProducts } from "@/features/catalog/loadCompanyCatalog";

jest.mock("@/features/catalog/lecotApiSearch", () => ({
  ...jest.requireActual("@/features/catalog/lecotApiSearch"),
  searchLecotViaApi: jest.fn(),
  lecotApiBaseUrl: jest.fn(() => null),
}));

jest.mock("@/features/catalog/loadCompanyCatalog", () => ({
  loadCompanyCatalogProducts: jest.fn(async () => []),
}));

jest.mock("@/features/catalog/lecotSupplierOrder", () => ({
  submitLecotSupplierOrder: jest.fn(),
}));

jest.mock("@/features/catalog/lecotOrderFlags", () => ({
  lecotDemoOrdersEnabled: jest.fn(() => false),
}));

const mockSearchApi = searchLecotViaApi as jest.MockedFunction<typeof searchLecotViaApi>;
const mockSubmit = submitLecotSupplierOrder as jest.MockedFunction<typeof submitLecotSupplierOrder>;
const mockLoadCatalog = loadCompanyCatalogProducts as jest.MockedFunction<
  typeof loadCompanyCatalogProducts
>;

const mockSupplierAdd = jest.fn();
const mockSupplierUpdate = jest.fn();
const mockMaterialAdd = jest.fn();
const mockInterventionGet = jest.fn();
const mockInterventionUpdate = jest.fn();
const mockTimelineAdd = jest.fn();

jest.mock("firebase-admin", () => {
  const serverTimestamp = jest.fn(() => "TS");
  const firestoreImpl = jest.fn(() => ({
    collection: (name: string) => {
      if (name === "interventions") {
        return {
          doc: () => ({
            get: mockInterventionGet,
          }),
        };
      }
      if (name === "material_orders") {
        return { add: mockMaterialAdd };
      }
      if (name === "companies") {
        return {
          doc: () => ({
            collection: () => ({
              add: mockSupplierAdd,
            }),
          }),
        };
      }
      return { doc: jest.fn(), add: jest.fn() };
    },
  }));
  (firestoreImpl as jest.Mock & { FieldValue: { serverTimestamp: jest.Mock } }).FieldValue = {
    serverTimestamp,
  };
  return {
    apps: [{ name: "test" }],
    firestore: firestoreImpl,
  };
});

describe("chatbot-lecot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadCatalog.mockResolvedValue([]);
    mockSearchApi.mockResolvedValue(null);
    mockSubmit.mockResolvedValue({
      ok: true,
      source: "manual",
      message: "Manuel",
      lines: [],
    });
    mockSupplierAdd.mockResolvedValue({ id: "supplier-order-1", update: mockSupplierUpdate });
    mockMaterialAdd.mockResolvedValue({ id: "material-order-1" });
    mockSupplierUpdate.mockResolvedValue(undefined);
    mockInterventionGet.mockResolvedValue({
      exists: true,
      data: () => ({ companyId: "co-1", billingLines: [] }),
      ref: {
        update: mockInterventionUpdate,
        collection: (sub: string) =>
          sub === "timeline_events" ? { add: mockTimelineAdd } : { add: jest.fn() },
      },
    });
    mockInterventionUpdate.mockResolvedValue(undefined);
    mockTimelineAdd.mockResolvedValue({ id: "tl-1" });
  });

  it("search returns local catalog hits for short query", async () => {
    const result = await searchLecotProductsForChatbot("co-1", "cylindre");
    expect(result.query).toBe("cylindre");
    expect(result.products.length).toBeGreaterThan(0);
  });

  it("search suggests perceuse hits from catalog", async () => {
    const result = await searchLecotProductsForChatbot("co-1", "perceuse", 3);
    expect(result.query).toContain("perceuse");
    expect(result.suggestions?.length).toBeGreaterThan(0);
    expect(result.suggestions?.length).toBeLessThanOrEqual(5);
    expect(String(result.suggestions?.[0]?.label).toLowerCase()).toContain("perceuse");
    expect(result.suggestions?.[0]?.markdownLink).toContain("lecot:");
    expect(result.instruction).toBeTruthy();
  });

  it("search matches long user description", async () => {
    const result = await searchLecotProductsForChatbot(
      "co-1",
      "Cylindre double de chantier - FTH - fermeture differente",
    );
    expect(result.products.length).toBeGreaterThan(0);
    expect(String(result.products[0]?.label).toLowerCase()).toContain("cylindre");
  });

  it("order fills unitPriceCents from catalog when price omitted but SKU matches", async () => {
    mockSubmit.mockResolvedValue({ ok: true, source: "api", orderId: "L-1" });

    await orderLecotPartsForChatbot(
      { companyId: "co-1", actorUid: "uid-1", role: "admin" },
      {
        userConfirmed: true,
        lines: [{ sku: "LEC-2001", label: "Serrure multipoints Vachette", quantity: 1 }],
        interventionId: "iv-1",
      },
    );

    const payload = mockSupplierAdd.mock.calls[0]?.[0] as {
      lines: Array<{ unitPriceCents: number }>;
      totalCents: number;
    };
    expect(payload.lines[0].unitPriceCents).toBe(14500);
    expect(payload.totalCents).toBe(14500);
  });

  it("order accepts unitPriceEur when unitPriceCents omitted", async () => {
    mockSubmit.mockResolvedValue({ ok: true, source: "api", orderId: "L-2" });

    await orderLecotPartsForChatbot(
      { companyId: "co-1", actorUid: "uid-1", role: "admin" },
      {
        userConfirmed: true,
        lines: [{ label: "Article perso", quantity: 2, unitPriceEur: 10.5 }],
      },
    );

    const payload = mockSupplierAdd.mock.calls[0]?.[0] as {
      lines: Array<{ unitPriceCents: number; quantity: number }>;
      totalCents: number;
    };
    expect(payload.lines[0].unitPriceCents).toBe(1050);
    expect(payload.totalCents).toBe(2100);
  });

  it("order creates supplier order and calls Lecot submit", async () => {
    mockSubmit.mockResolvedValue({ ok: true, source: "api", orderId: "L-99" });

    const result = await orderLecotPartsForChatbot(
      { companyId: "co-1", actorUid: "uid-1", role: "admin" },
      {
        userConfirmed: true,
        lines: [{ sku: "Y123", label: "Cylindre Yale", quantity: 2, unitPriceCents: 4500 }],
        interventionId: "iv-1",
      },
    );

    expect(mockSubmit).toHaveBeenCalled();
    expect(result.supplierOrderId).toBe("supplier-order-1");
    expect(result.lecot).toEqual({ ok: true, source: "api", orderId: "L-99" });
    expect(mockSupplierAdd).toHaveBeenCalled();
    expect(mockMaterialAdd).toHaveBeenCalled();
    expect(result.materialOrderId).toBe("material-order-1");
    expect(result.billingSynced).toBe(true);
    expect(mockInterventionUpdate).toHaveBeenCalled();
    expect(mockTimelineAdd).toHaveBeenCalled();
  });

  it("order auto-generates sku when only label provided", async () => {
    const result = await orderLecotPartsForChatbot(
      { companyId: "co-1", actorUid: "uid-1", role: "admin" },
      {
        userConfirmed: true,
        lines: [{ label: "Cylindre FTH chantier", quantity: 2 }],
      },
    );
    expect(result.lines[0]?.sku).toMatch(/^CUSTOM-/);
    expect(result.lines[0]?.quantity).toBe(2);
  });

  it("order rejects missing label", async () => {
    await expect(
      orderLecotPartsForChatbot(
        { companyId: "co-1", actorUid: "uid-1", role: "admin" },
        {
          userConfirmed: true,
          lines: [{ sku: "X", label: "", quantity: 1 }],
        },
      ),
    ).rejects.toThrow(/label/);
  });

  it("extractLecotProductQueryFromFollowUp strips article for short answers", () => {
    expect(extractLecotProductQueryFromFollowUp("une serrure")).toBe("serrure");
    expect(extractLecotProductQueryFromFollowUp("commande lecot")).toBeNull();
  });

  it("extractLecotProductQueryFromFollowUp strips je cherche / je veux", () => {
    expect(extractLecotProductQueryFromFollowUp("Je cherche une serrure multipoints")).toBe(
      "serrure multipoints",
    );
    expect(extractLecotProductQueryFromFollowUp("Je veux une serrure Vachette")).toBe("serrure Vachette");
  });

  it("tryLecotProductFollowUpIntent searches after commande lecot context", async () => {
    const reply = await tryLecotProductFollowUpIntent(
      "une serrure",
      [
        { role: "user", content: "commande lecot" },
        { role: "assistant", content: "Quel produit ?" },
        { role: "user", content: "une serrure" },
      ],
      "co-1",
    );
    expect(reply).toMatch(/Catalogue Lecot/i);
    expect(reply).toMatch(/SKU/i);
  });

  it("formatLecotSearchReplyForChat lists markdown suggestions", async () => {
    const result = await searchLecotProductsForChatbot("co-1", "serrure", 3);
    const text = formatLecotSearchReplyForChat(result);
    expect(text).toContain("lecot:");
    expect(text).toMatch(/commander/i);
  });
});
