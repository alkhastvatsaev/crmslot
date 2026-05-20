/** @jest-environment node */

import { TextDecoder, TextEncoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import { generateMaterialOrdersPdf } from "@/features/materials/generateMaterialOrderPdf";

describe("generateMaterialOrdersPdf", () => {
  it("returns PDF for intervention material orders", () => {
    const pdf = generateMaterialOrdersPdf("iv-1", [
      {
        id: "m1",
        interventionId: "iv-1",
        technicianUid: "t1",
        partsRequested: [{ description: "Cylindre", quantity: 1, reference: "SKU1" }],
        urgency: "normal",
        status: "pending",
        createdAt: "2026-05-18T10:00:00.000Z",
        updatedAt: "2026-05-18T10:00:00.000Z",
      },
    ]);
    expect(pdf.byteLength).toBeGreaterThan(400);
    expect(String.fromCharCode(pdf[0], pdf[1], pdf[2], pdf[3])).toBe("%PDF");
  });
});
