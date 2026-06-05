import { QueryClient } from "@tanstack/react-query";
import type { Intervention } from "@/features/interventions/types";
import {
  canTechnicianReopenCompletedIntervention,
  reopenTechnicianCompletedIntervention,
  TECHNICIAN_REOPEN_EXTRA_PATCH,
} from "@/features/interventions/technicianReopenCompletedIntervention";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";

jest.mock("@/features/interventions/workflow/transitionInterventionFromTechnician", () => ({
  transitionInterventionFromTechnician: jest.fn().mockResolvedValue(undefined),
}));

const mockTransition = transitionInterventionFromTechnician as jest.MockedFunction<
  typeof transitionInterventionFromTechnician
>;

const baseIv: Intervention = {
  id: "iv-done-1",
  title: "Chaudière",
  address: "Rue test",
  time: "10:00",
  status: "done",
  location: { lat: 50.85, lng: 4.35 },
  assignedTechnicianUid: "tech-1",
  statusUpdatedAt: "2026-05-16T10:00:00.000Z",
  completedAt: "2026-05-16T11:00:00.000Z",
  completedByUid: "tech-1",
};

describe("canTechnicianReopenCompletedIntervention", () => {
  it("allows done mission without billing artifacts", () => {
    expect(canTechnicianReopenCompletedIntervention(baseIv, "tech-1")).toEqual({ allowed: true });
  });

  it("blocks invoiced status", () => {
    expect(
      canTechnicianReopenCompletedIntervention({ ...baseIv, status: "invoiced" }, "tech-1"),
    ).toEqual({ allowed: false, reason: "invoiced" });
  });

  it("blocks when invoice PDF exists", () => {
    expect(
      canTechnicianReopenCompletedIntervention(
        { ...baseIv, invoicePdfUrl: "https://storage/inv.pdf" },
        "tech-1",
      ),
    ).toEqual({ allowed: false, reason: "invoice_pdf" });
  });

  it("blocks wrong assignee", () => {
    expect(canTechnicianReopenCompletedIntervention(baseIv, "other-tech")).toEqual({
      allowed: false,
      reason: "not_assigned",
    });
  });
});

describe("reopenTechnicianCompletedIntervention", () => {
  beforeEach(() => {
    mockTransition.mockClear();
  });

  it("transitions done to in_progress and clears completion timestamps", async () => {
    const queryClient = new QueryClient();
    await reopenTechnicianCompletedIntervention({
      iv: baseIv,
      technicianUid: "tech-1",
      queryClient,
    });

    expect(mockTransition).toHaveBeenCalledWith(
      expect.objectContaining({
        interventionId: "iv-done-1",
        toStatus: "in_progress",
        extraPatch: expect.objectContaining(TECHNICIAN_REOPEN_EXTRA_PATCH),
      }),
    );
  });

  it("rejects when invoice PDF present", async () => {
    const queryClient = new QueryClient();
    await expect(
      reopenTechnicianCompletedIntervention({
        iv: { ...baseIv, invoicePdfUrl: "https://x.pdf" },
        technicianUid: "tech-1",
        queryClient,
      }),
    ).rejects.toThrow(/REOPEN_BLOCKED:invoice_pdf/);
    expect(mockTransition).not.toHaveBeenCalled();
  });
});
