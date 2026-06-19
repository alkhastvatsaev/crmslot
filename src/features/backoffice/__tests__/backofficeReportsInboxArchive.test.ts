import {
  canArchiveBackofficeReportInInbox,
  isBackofficeReportArchivedInInbox,
  isBackofficeReportInInboxActiveQueue,
  isBackofficeReportInInboxArchive,
} from "@/features/backoffice/backofficeReportsInboxArchive";
import type { Intervention } from "@/features/interventions/types";

function iv(
  partial: Pick<Intervention, "status"> &
    Partial<Pick<Intervention, "backofficeReportsArchivedAt" | "technicianReportAmendedAt">>
): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    ...partial,
  };
}

describe("backofficeReportsInboxArchive", () => {
  it("active queue: done or invoiced without archive timestamp", () => {
    expect(isBackofficeReportInInboxActiveQueue(iv({ status: "done" }))).toBe(true);
    expect(isBackofficeReportInInboxActiveQueue(iv({ status: "invoiced" }))).toBe(true);
    expect(
      isBackofficeReportInInboxActiveQueue(
        iv({ status: "invoiced", backofficeReportsArchivedAt: "2026-06-01T10:00:00.000Z" })
      )
    ).toBe(false);
  });

  it("active queue: technician amendment resurfaces archived invoiced report", () => {
    expect(
      isBackofficeReportInInboxActiveQueue(
        iv({
          status: "invoiced",
          backofficeReportsArchivedAt: "2026-06-01T10:00:00.000Z",
          technicianReportAmendedAt: "2026-06-02T10:00:00.000Z",
        })
      )
    ).toBe(true);
  });

  it("archive section: only when archive timestamp is set", () => {
    expect(isBackofficeReportInInboxArchive(iv({ status: "invoiced" }))).toBe(false);
    expect(
      isBackofficeReportInInboxArchive(
        iv({ status: "invoiced", backofficeReportsArchivedAt: "2026-06-01T10:00:00.000Z" })
      )
    ).toBe(true);
    expect(
      isBackofficeReportInInboxArchive(
        iv({ status: "done", backofficeReportsArchivedAt: "2026-06-01T10:00:00.000Z" })
      )
    ).toBe(true);
  });

  it("canArchive mirrors active queue", () => {
    expect(canArchiveBackofficeReportInInbox(iv({ status: "done" }))).toBe(true);
    expect(
      canArchiveBackofficeReportInInbox(
        iv({ status: "invoiced", backofficeReportsArchivedAt: "2026-06-01T10:00:00.000Z" })
      )
    ).toBe(false);
  });

  it("isBackofficeReportArchivedInInbox ignores empty strings", () => {
    expect(
      isBackofficeReportArchivedInInbox(iv({ status: "done", backofficeReportsArchivedAt: "" }))
    ).toBe(false);
    expect(
      isBackofficeReportArchivedInInbox(iv({ status: "done", backofficeReportsArchivedAt: "  " }))
    ).toBe(false);
  });
});
