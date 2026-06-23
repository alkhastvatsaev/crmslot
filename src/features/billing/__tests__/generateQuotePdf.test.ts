/** @jest-environment node */

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import {
  generateInterventionInvoicePdf,
  generateInterventionQuotePdf,
} from "@/features/billing/generateQuotePdf";
import type { Intervention } from "@/features/interventions";

describe("generateInterventionQuotePdf", () => {
  it("returns non-empty pdf bytes", () => {
    const pdf = generateInterventionQuotePdf({
      id: "iv-1",
      title: "Test",
      address: "Bruxelles",
      time: "10:00",
      status: "done",
      location: { lat: 50, lng: 4 },
      clientName: "Dupont",
      billingLines: [{ description: "Main", quantity: 1, unitPriceCents: 5000 }],
    } as Intervention);
    expect(pdf.byteLength).toBeGreaterThan(500);
  });

  it("returns non-empty invoice pdf bytes", () => {
    const pdf = generateInterventionInvoicePdf({
      id: "iv-fac-demo",
      title: "Serrure",
      address: "Rue de la Fourche 9, 1000 Bruxelles",
      time: "10:00",
      status: "invoiced",
      location: { lat: 50, lng: 4 },
      clientName: "Monsieur Vatsaev",
      billingLines: [
        { description: "Serrure 3 points Fichet", quantity: 1, unitPriceCents: 30000 },
        { description: "Main-d'œuvre", quantity: 1, unitPriceCents: 5000 },
      ],
    } as Intervention);
    expect(pdf.byteLength).toBeGreaterThan(1200);
  });
});
