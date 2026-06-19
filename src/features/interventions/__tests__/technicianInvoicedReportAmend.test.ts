import {
  canTechnicianAmendInvoicedReport,
  hasPendingTechnicianReportAmendment,
} from "@/features/interventions/technicianInvoicedReportAmend";
import type { Intervention } from "@/features/interventions/types";

function iv(partial: Partial<Intervention> = {}): Intervention {
  return {
    id: "iv-1",
    title: "Test",
    address: "Rue 1",
    time: "10:00",
    location: { lat: 0, lng: 0 },
    status: "invoiced",
    assignedTechnicianUid: "tech-1",
    ...partial,
  };
}

describe("technicianInvoicedReportAmend", () => {
  it("allows assigned technician on invoiced intervention", () => {
    expect(canTechnicianAmendInvoicedReport(iv(), "tech-1")).toEqual({ allowed: true });
  });

  it("blocks wrong status or unassigned technician", () => {
    expect(canTechnicianAmendInvoicedReport(iv({ status: "done" }), "tech-1")).toEqual({
      allowed: false,
      reason: "wrong_status",
    });
    expect(canTechnicianAmendInvoicedReport(iv(), "other-tech")).toEqual({
      allowed: false,
      reason: "not_assigned",
    });
  });

  it("detects pending amendment flag", () => {
    expect(hasPendingTechnicianReportAmendment(iv())).toBe(false);
    expect(
      hasPendingTechnicianReportAmendment(
        iv({ technicianReportAmendedAt: "2026-06-01T10:00:00.000Z" })
      )
    ).toBe(true);
  });
});
