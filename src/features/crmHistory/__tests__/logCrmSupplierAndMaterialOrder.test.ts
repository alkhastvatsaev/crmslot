import {
  logCrmMaterialOrderPlacedAdmin,
  logCrmSupplierOrderPlacedAdmin,
} from "../logCrmSupplierAndMaterialOrder";
import { logCompanyCrmActivityAdmin } from "../logCompanyCrmActivityAdmin";

jest.mock("../logCompanyCrmActivityAdmin", () => ({
  logCompanyCrmActivityAdmin: jest.fn(() => Promise.resolve("crm-1")),
}));

jest.mock("@/core/config/firebase-admin", () => ({
  getAdminDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ exists: false }),
      })),
    })),
  })),
}));

describe("logCrmSupplierAndMaterialOrder", () => {
  const ctx = { companyId: "co-1", actorUid: "u-1", role: "admin" as const };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("logs supplier order without intervention (page Matériel)", async () => {
    await logCrmSupplierOrderPlacedAdmin({
      ctx,
      supplierOrderId: "ord-xyz",
      lines: [{ sku: "S1", label: "Cylindre", quantity: 1, unitPriceCents: 5000 }],
      totalCents: 5000,
      status: "sent",
      clientName: "Dupont",
    });
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "supplier_order_lecot",
        companyId: "co-1",
        note: expect.stringMatching(/Dupont|Lecot/i),
      }),
    );
  });

  it("logs material order when linked to intervention", async () => {
    await logCrmMaterialOrderPlacedAdmin({
      ctx,
      materialOrderId: "mo-1",
      interventionId: "iv-1",
      partsSummary: "2× Cylindre",
      status: "ordered",
      clientName: "Martin",
      supplierOrderId: "ord-1",
    });
    expect(logCompanyCrmActivityAdmin).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        kind: "material_order_placed",
        interventionId: "iv-1",
      }),
    );
  });
});
