/** @jest-environment node */

import {
  e2eSeedAssignedInterventionAdmin,
  E2E_ASSIGNED_INTERVENTION_ID,
} from "@/features/interventions/server/e2eSeedAssignedIntervention";

describe("e2eSeedAssignedInterventionAdmin", () => {
  it("creates or resets an assigned intervention for E2E", async () => {
    const set = jest.fn(async () => undefined);
    const update = jest.fn(async () => undefined);
    const get = jest.fn(async () => ({ exists: false }));

    const db = {
      collection: () => ({
        doc: () => ({ get, set, update }),
      }),
    };

    const result = await e2eSeedAssignedInterventionAdmin(db as never);

    expect(result.interventionId).toBe(E2E_ASSIGNED_INTERVENTION_ID);
    expect(result.companyId).toBe("demo-local-company");
    expect(result.reset).toBe(false);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "assigned",
        companyId: "demo-local-company",
        assignedTechnicianUid: expect.any(String),
      })
    );
  });
});
