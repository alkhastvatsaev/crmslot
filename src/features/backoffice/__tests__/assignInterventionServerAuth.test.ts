import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";

describe("assignInterventionServerAuth", () => {
  it("allows admin via bmTenants", async () => {
    const db = {
      doc: () => ({ get: async () => ({ exists: false }) }),
    } as never;
    const ok = await assertCanAssignInterventionServer(db, "uid-1", "co-a", {
      bmTenants: ["co-a:admin"],
    } as never);
    expect(ok).toBe(true);
  });

  it("allows collaborateur via bmTenants", async () => {
    const db = {
      doc: () => ({ get: async () => ({ exists: false }) }),
    } as never;
    const ok = await assertCanAssignInterventionServer(db, "uid-1", "co-a", {
      bmTenants: ["co-a:collaborateur"],
    } as never);
    expect(ok).toBe(true);
  });

  it("allows collaborateur via membership doc", async () => {
    const db = {
      doc: () => ({
        get: async () => ({ exists: true, data: () => ({ role: "collaborateur" }) }),
      }),
    } as never;
    const ok = await assertCanAssignInterventionServer(db, "uid-1", "co-a", {} as never);
    expect(ok).toBe(true);
  });

  it("rejects unknown company without membership", async () => {
    const db = {
      doc: () => ({ get: async () => ({ exists: false }) }),
    } as never;
    const ok = await assertCanAssignInterventionServer(db, "uid-1", "co-a", {} as never);
    expect(ok).toBe(false);
  });
});
