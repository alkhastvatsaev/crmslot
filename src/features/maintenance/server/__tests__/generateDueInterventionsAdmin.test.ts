/** @jest-environment node */

import type { MaintenanceContract } from "@/features/maintenance/types";

const batchSet = jest.fn();
const batchUpdate = jest.fn();
const batchCommit = jest.fn(async () => undefined);

const contracts: Array<Partial<MaintenanceContract> & { id: string }> = [];

const collectionGroupGet = jest.fn(async () => ({
  docs: contracts.map((c) => ({
    id: c.id,
    data: () => {
      const { id, ...rest } = c;
      void id;
      return rest;
    },
  })),
}));

jest.mock("@/core/config/firebase-admin", () => ({
  isFirebaseAdminReady: () => true,
  getAdminDb: () => ({
    collectionGroup: () => ({
      where: () => ({ get: collectionGroupGet }),
    }),
    collection: (name: string) => ({
      doc: (id?: string) => ({
        id: id ?? "generated-id",
        collection: (sub: string) => ({
          doc: (subId: string) => ({ path: `companies/${id}/${sub}/${subId}` }),
        }),
        path: `${name}/${id ?? "generated-id"}`,
      }),
    }),
    batch: () => ({ set: batchSet, update: batchUpdate, commit: batchCommit }),
  }),
}));

import { generateDueInterventionsAdmin } from "@/features/maintenance/server/generateDueInterventionsAdmin";

function contract(partial: Partial<MaintenanceContract> & { id: string }): typeof partial {
  return {
    companyId: "co-1",
    clientId: "cl-1",
    siteId: null,
    label: "Maintenance annuelle",
    frequency: "monthly",
    nextDueDate: "2026-06-01",
    interventionTemplate: { title: "Vérification cylindres" },
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("generateDueInterventionsAdmin", () => {
  beforeEach(() => {
    contracts.length = 0;
    jest.clearAllMocks();
  });

  it("creates interventions for due contracts and advances nextDueDate", async () => {
    contracts.push(contract({ id: "ct-due", nextDueDate: "2026-06-01" }));
    const result = await generateDueInterventionsAdmin(new Date("2026-06-10T08:00:00Z"));

    expect(result).toEqual({ scanned: 1, created: 1 });
    expect(batchSet).toHaveBeenCalledTimes(1);
    const draft = batchSet.mock.calls[0][1] as Record<string, unknown>;
    expect(draft.status).toBe("pending");
    expect(draft.sourceContractId).toBe("ct-due");
    expect(draft.source).toBe("maintenance_contract");

    expect(batchUpdate).toHaveBeenCalledTimes(1);
    const patch = batchUpdate.mock.calls[0][1] as { nextDueDate: string };
    // monthly = +30 jours après le 2026-06-01
    expect(patch.nextDueDate).toBe("2026-07-01");
    expect(batchCommit).toHaveBeenCalledTimes(1);
  });

  it("does nothing when no contract is due", async () => {
    contracts.push(contract({ id: "ct-future", nextDueDate: "2099-01-01" }));
    const result = await generateDueInterventionsAdmin(new Date("2026-06-10T08:00:00Z"));

    expect(result).toEqual({ scanned: 1, created: 0 });
    expect(batchSet).not.toHaveBeenCalled();
    expect(batchCommit).not.toHaveBeenCalled();
  });
});
