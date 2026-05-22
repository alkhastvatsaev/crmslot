/** @jest-environment node */

import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import { generateSupplierOrderPdf } from "@/features/suppliers/generateSupplierOrderPdf";
import type { SupplierOrder } from "@/features/suppliers/types";

describe("generateSupplierOrderPdf", () => {
  it("returns a non-empty PDF buffer", () => {
    const order: SupplierOrder = {
      id: "ord-1",
      companyId: "co-1",
      supplierId: "lecot",
      supplierName: "Lecot",
      status: "draft",
      lines: [{ sku: "A1", label: "Cylindre", quantity: 2, unitPriceCents: 2500 }],
      totalCents: 5000,
      createdAt: "2026-05-18T10:00:00.000Z",
      updatedAt: "2026-05-18T10:00:00.000Z",
    };
    const pdf = generateSupplierOrderPdf(
      { ...order, clientName: "Martin SPRL" },
      { companyName: "Test SRL" },
    );
    expect(pdf.byteLength).toBeGreaterThan(500);
    expect(String.fromCharCode(pdf[0], pdf[1], pdf[2], pdf[3])).toBe("%PDF");
  });
});
