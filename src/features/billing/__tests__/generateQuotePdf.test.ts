/** @jest-environment node */

import { TextEncoder, TextDecoder } from "util";

Object.assign(global, { TextEncoder, TextDecoder });

import { generateInterventionQuotePdf } from "@/features/billing/generateQuotePdf";
import type { Intervention } from "@/features/interventions/types";

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
});
