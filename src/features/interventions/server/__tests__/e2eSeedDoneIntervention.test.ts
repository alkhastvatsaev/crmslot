/** @jest-environment node */

import {
  e2eSeedDoneInterventionAdmin,
  E2E_DONE_INTERVENTION_ID,
} from "@/features/interventions/server/e2eSeedDoneIntervention";

describe("e2eSeedDoneInterventionAdmin", () => {
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

  it("creates or resets a done intervention for E2E", async () => {
    const set = jest.fn(async () => undefined);
    const update = jest.fn(async () => undefined);
    const get = jest.fn(async () => ({ exists: false }));

    const db = {
      collection: () => ({
        doc: () => ({ get, set, update }),
      }),
    };

    const result = await e2eSeedDoneInterventionAdmin(db as never);

    expect(result.interventionId).toBe(E2E_DONE_INTERVENTION_ID);
    expect(result.companyId).toBe("e2e-co");
    expect(result.reset).toBe(false);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "done",
        companyId: "e2e-co",
        billingLines: expect.arrayContaining([
          expect.objectContaining({ description: "Déplacement urgence" }),
        ]),
      })
    );
  });

  it("updates when document already exists", async () => {
    const set = jest.fn(async () => undefined);
    const update = jest.fn(async () => undefined);
    const get = jest.fn(async () => ({ exists: true }));

    const db = {
      collection: () => ({
        doc: () => ({ get, set, update }),
      }),
    };

    const result = await e2eSeedDoneInterventionAdmin(db as never);
    expect(result.reset).toBe(true);
    expect(update).toHaveBeenCalled();
    expect(set).not.toHaveBeenCalled();
  });
});
