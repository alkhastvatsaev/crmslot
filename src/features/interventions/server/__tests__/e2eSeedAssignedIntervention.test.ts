/** @jest-environment node */

import {
  e2eSeedAssignedInterventionAdmin,
  E2E_ASSIGNED_INTERVENTION_ID,
} from "@/features/interventions/server/e2eSeedAssignedIntervention";

describe("e2eSeedAssignedInterventionAdmin", () => {
  const prevCompany = process.env.E2E_SEED_COMPANY_ID;
  const prevTech = process.env.E2E_SEED_TECHNICIAN_UID;

  beforeAll(() => {
    process.env.E2E_SEED_COMPANY_ID = "e2e-co";
    process.env.E2E_SEED_TECHNICIAN_UID = "e2e-tech";
  });

  afterAll(() => {
    if (prevCompany === undefined) delete process.env.E2E_SEED_COMPANY_ID;
    else process.env.E2E_SEED_COMPANY_ID = prevCompany;
    if (prevTech === undefined) delete process.env.E2E_SEED_TECHNICIAN_UID;
    else process.env.E2E_SEED_TECHNICIAN_UID = prevTech;
  });

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
    expect(result.companyId).toBe("e2e-co");
    expect(result.reset).toBe(false);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "in_progress",
        technicianAcceptedAt: expect.any(String),
        companyId: "e2e-co",
        assignedTechnicianUid: "e2e-tech",
      })
    );
  });
});
