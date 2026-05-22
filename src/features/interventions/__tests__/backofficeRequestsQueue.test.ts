import type { Intervention } from "@/features/interventions/types";
import {
  isInterventionAwaitingTechnicianAcceptance,
  isInterventionInBackofficeRequestsQueue,
  isInterventionPendingBackOfficeIntake,
} from "@/features/interventions/technicianSchedule";

function iv(
  partial: Partial<Pick<Intervention, "status" | "technicianAcceptedAt">> = {},
): Pick<Intervention, "status" | "technicianAcceptedAt"> {
  return { status: "pending", ...partial };
}

describe("isInterventionInBackofficeRequestsQueue", () => {
  it("includes pending intake", () => {
    expect(isInterventionInBackofficeRequestsQueue(iv({ status: "pending" }))).toBe(true);
    expect(isInterventionPendingBackOfficeIntake(iv({ status: "pending" }))).toBe(true);
  });

  it("includes assigned awaiting accept", () => {
    expect(isInterventionInBackofficeRequestsQueue(iv({ status: "assigned" }))).toBe(true);
    expect(isInterventionAwaitingTechnicianAcceptance(iv({ status: "assigned" }))).toBe(true);
    expect(isInterventionPendingBackOfficeIntake(iv({ status: "assigned" }))).toBe(false);
  });

  it("includes legacy in_progress without accept", () => {
    const row = iv({ status: "in_progress", technicianAcceptedAt: undefined });
    expect(isInterventionInBackofficeRequestsQueue(row)).toBe(true);
  });

  it("excludes accepted field missions", () => {
    expect(
      isInterventionInBackofficeRequestsQueue({
        status: "en_route",
        technicianAcceptedAt: "2026-05-16T08:00:00.000Z",
      }),
    ).toBe(false);
  });
});
