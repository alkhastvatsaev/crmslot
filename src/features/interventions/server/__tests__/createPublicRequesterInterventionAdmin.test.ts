import { createPublicRequesterInterventionAdmin } from "@/features/interventions/server/createPublicRequesterInterventionAdmin";

jest.mock("@/features/backoffice/server/ensureCompanyAcceptsPublicInterventionsAdmin", () => ({
  ensureCompanyAcceptsPublicInterventionsAdmin: jest.fn(async () => ({ ok: true })),
}));

function mockDb(existing = false) {
  const set = jest.fn(async () => undefined);
  const get = jest.fn(async () => ({ exists: existing }));
  return {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({ get, set })),
    })),
    _set: set,
  } as unknown as import("firebase-admin").firestore.Firestore & { _set: jest.Mock };
}

describe("createPublicRequesterInterventionAdmin", () => {
  it("rejects payload when createdByUid does not match auth uid", async () => {
    const db = mockDb();
    const result = await createPublicRequesterInterventionAdmin({
      db,
      uid: "user-a",
      companyId: "co-1",
      interventionId: "iv-1",
      payload: {
        createdByUid: "user-b",
        companyId: "co-1",
        status: "pending",
        title: "Test",
      },
    });
    expect(result).toEqual({ ok: false, status: 400, error: "createdByUid invalide." });
  });

  it("creates intervention when payload is valid", async () => {
    const db = mockDb(false);
    const result = await createPublicRequesterInterventionAdmin({
      db,
      uid: "user-a",
      companyId: "co-1",
      interventionId: "iv-1",
      payload: {
        createdByUid: "user-a",
        companyId: "co-1",
        status: "pending",
        title: "Porte bloquée",
        address: "Rue Test 1",
      },
    });
    expect(result).toEqual({ ok: true, id: "iv-1" });
    expect((db as { _set: jest.Mock })._set).toHaveBeenCalled();
  });
});
