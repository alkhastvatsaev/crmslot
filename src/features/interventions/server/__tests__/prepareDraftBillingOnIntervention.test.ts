/** @jest-environment node */

import { prepareDraftBillingOnIntervention } from "@/features/interventions/server/prepareDraftBillingOnIntervention";
import type { Intervention } from "@/features/interventions/types";

const mockBuild = jest.fn();

jest.mock("@/features/interventions/draftInvoiceBilling", () => ({
  buildDraftBillingPackage: (...args: unknown[]) => mockBuild(...args),
}));

function makeDb(iv: Intervention) {
  const update = jest.fn(async () => undefined);
  const get = jest.fn(async () => ({
    exists: true,
    id: iv.id,
    data: () => iv,
  }));
  return {
    collection: () => ({
      doc: () => ({ get, update }),
    }),
    __update: update,
  };
}

describe("prepareDraftBillingOnIntervention", () => {
  beforeEach(() => {
    mockBuild.mockReset();
    mockBuild.mockResolvedValue({
      lines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
      invoiceAmountCents: 4500,
      source: "template",
      aiNote: "ok",
    });
  });

  it("patches billing fields on the intervention document", async () => {
    const iv: Intervention = {
      id: "iv-draft-1",
      title: "Porte",
      address: "Rue 1",
      time: "10:00",
      status: "done",
      location: { lat: 50.8, lng: 4.35 },
      problem: "porte bloquée",
    };
    const db = makeDb(iv);

    const result = await prepareDraftBillingOnIntervention(
      db as unknown as Parameters<typeof prepareDraftBillingOnIntervention>[0],
      iv.id
    );

    expect(mockBuild).toHaveBeenCalledWith(iv, { surchargeSettings: undefined });
    expect(db.__update).toHaveBeenCalledWith(
      expect.objectContaining({
        billingLines: [{ description: "Déplacement", quantity: 1, unitPriceCents: 4500 }],
        invoiceAmountCents: 4500,
        draftBillingSource: "template",
        draftBillingAiNote: "ok",
      })
    );
    expect(result.invoiceAmountCents).toBe(4500);
  });

  it("throws when intervention is missing", async () => {
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false }),
        }),
      }),
    };
    await expect(
      prepareDraftBillingOnIntervention(
        db as unknown as Parameters<typeof prepareDraftBillingOnIntervention>[0],
        "missing"
      )
    ).rejects.toThrow("Intervention introuvable");
  });
});
