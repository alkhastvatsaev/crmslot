/** @jest-environment node */

import { technicianAmendInvoicedReportAdmin } from "@/features/interventions/server/technicianAmendInvoicedReportAdmin";

const mockLog = jest.fn();

jest.mock("@/features/crmHistory/logCrmInterventionActionAdmin", () => ({
  logCrmInterventionActionAdmin: (...args: unknown[]) => mockLog(...args),
}));

describe("technicianAmendInvoicedReportAdmin", () => {
  beforeEach(() => {
    mockLog.mockReset();
  });

  it("stores amendment metadata and clears archive", async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const db = {
      collection: () => ({
        doc: () => ({
          get: async () => ({
            exists: true,
            id: "iv-1",
            data: () => ({
              status: "invoiced",
              companyId: "co-1",
              title: "Porte",
              backofficeReportsArchivedAt: "2026-05-01T10:00:00.000Z",
            }),
          }),
          update,
        }),
      }),
    };

    await technicianAmendInvoicedReportAdmin({
      db: db as never,
      interventionId: "iv-1",
      actorUid: "tech-1",
      patch: { completionPhotoUrls: ["https://x/1.jpg"] },
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        completionPhotoUrls: ["https://x/1.jpg"],
        technicianReportAmendedByUid: "tech-1",
        backofficeReportsArchivedAt: null,
      })
    );
    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "intervention_terrain_report_received",
        actorRole: "technician",
      })
    );
  });
});
