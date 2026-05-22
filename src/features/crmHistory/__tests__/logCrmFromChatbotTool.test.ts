import * as admin from "firebase-admin";
import { logCrmFromChatbotTool } from "../logCrmFromChatbotTool";
import { logCompanyCrmActivityAdmin } from "../logCompanyCrmActivityAdmin";

jest.mock("../logCompanyCrmActivityAdmin", () => ({
  logCompanyCrmActivityAdmin: jest.fn(() => Promise.resolve("crm-1")),
}));

const mockGet = jest.fn();
const mockDoc = jest.fn(() => ({ get: mockGet }));
const mockCollection = jest.fn(() => ({ doc: mockDoc }));

jest.mock("firebase-admin", () => ({
  apps: [{ name: "test" }],
  firestore: jest.fn(() => ({
    collection: mockCollection,
  })),
}));

describe("logCrmFromChatbotTool", () => {
  const ctx = {
    companyId: "co-1",
    actorUid: "user-1",
    role: "admin" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({
      exists: true,
      id: "iv-1",
      data: () => ({
        companyId: "co-1",
        title: "Porte bloquée",
        address: "Rue Test 1",
        status: "pending",
        clientName: "Dupont",
      }),
    });
  });

  it("ignore les outils lecture", async () => {
    await logCrmFromChatbotTool("list_interventions", {}, { ok: true }, ctx);
    expect(logCompanyCrmActivityAdmin).not.toHaveBeenCalled();
  });

  it("ignore les échecs outil", async () => {
    await logCrmFromChatbotTool(
      "patch_intervention_billing",
      { interventionId: "iv-1", userConfirmed: true },
      { ok: false },
      ctx,
    );
    expect(logCompanyCrmActivityAdmin).not.toHaveBeenCalled();
  });

  it("journalise patch_intervention_billing", async () => {
    await logCrmFromChatbotTool(
      "patch_intervention_billing",
      { interventionId: "iv-1", userConfirmed: true },
      { ok: true, totalEur: 120 },
      ctx,
    );
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        companyId: "co-1",
        kind: "intervention_billing_updated",
        interventionId: "iv-1",
        actorUid: "user-1",
        note: expect.stringMatching(/Facturation|Facture/),
      }),
    );
  });

  it("journalise order_lecot_parts", async () => {
    await logCrmFromChatbotTool(
      "order_lecot_parts",
      { interventionId: "iv-1", userConfirmed: true },
      { ok: true, supplierOrderId: "ord-abc123", totalEur: 45.5 },
      ctx,
    );
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "supplier_order_lecot",
        note: expect.stringContaining("Lecot"),
      }),
    );
  });

  it("journalise update_intervention_status avec statut cible", async () => {
    await logCrmFromChatbotTool(
      "update_intervention_status",
      { interventionId: "iv-1", status: "in_progress", userConfirmed: true },
      { ok: true },
      ctx,
    );
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "chatbot_intervention_status",
        statusAfter: "in_progress",
        note: expect.stringContaining("in_progress"),
      }),
    );
  });

  it("journalise append_intervention_billing_lines sans être dans CHATBOT_WRITE_TOOLS", async () => {
    await logCrmFromChatbotTool(
      "append_intervention_billing_lines",
      { interventionId: "iv-1" },
      { ok: true, linesAdded: 2 },
      ctx,
    );
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalled();
  });
});
