/** @jest-environment node */

import { requestInterventionInvoiceReviewAdmin } from "@/features/interventions/server/requestInterventionInvoiceReviewAdmin";

const mockLog = jest.fn();

jest.mock("@/features/crmHistory/logCrmInterventionActionAdmin", () => ({
  logCrmInterventionActionAdmin: (...args: unknown[]) => mockLog(...args),
}));

describe("requestInterventionInvoiceReviewAdmin", () => {
  beforeEach(() => {
    mockLog.mockReset();
  });

  it("stores review note and logs CRM activity", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            id: "iv-1",
            data: () => ({ status: "done", companyId: "co-1", title: "Porte" }),
          }),
          update,
        }),
      }),
    };

    await requestInterventionInvoiceReviewAdmin({
      db: db as never,
      interventionId: "iv-1",
      actorUid: "tech-1",
      note: "Prix cylindre incorrect",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        invoiceReviewNote: "Prix cylindre incorrect",
        invoiceReviewRequestedByUid: "tech-1",
      })
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "intervention_billing_updated",
        actorRole: "technician",
      })
    );
  });

  it("rejects when intervention is not done", async () => {
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            id: "iv-1",
            data: () => ({ status: "in_progress" }),
          }),
        }),
      }),
    };

    await expect(
      requestInterventionInvoiceReviewAdmin({
        db: db as never,
        interventionId: "iv-1",
        actorUid: "tech-1",
        note: "test",
      })
    ).rejects.toThrow(/clôture/);
  });
});
