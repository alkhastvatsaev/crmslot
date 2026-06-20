import { upsertTechnicianCommissionRuleAdmin } from "@/features/commissions/server/commissionRulesAdmin";

function mockDb(docs: Array<{ id: string; data: Record<string, unknown> }>) {
  const store = new Map(docs.map((d) => [d.id, { ...d.data }]));
  let nextId = 1;

  const collection = () => ({
    where: () => ({
      get: async () => ({
        docs: [...store.entries()].map(([id, data]) => ({
          id,
          data: () => data,
        })),
      }),
    }),
    doc: (id: string) => ({
      update: async (patch: Record<string, unknown>) => {
        store.set(id, { ...store.get(id), ...patch });
      },
    }),
    add: async (data: Record<string, unknown>) => {
      const id = `new-${nextId++}`;
      store.set(id, data);
      return { id };
    },
  });

  return {
    db: { collection } as unknown as Parameters<typeof upsertTechnicianCommissionRuleAdmin>[0],
    store,
  };
}

describe("commissionRulesAdmin", () => {
  it("updates legacy personal rule and normalizes targetId", async () => {
    const { db, store } = mockDb([
      {
        id: "legacy",
        data: {
          companyId: "co-1",
          level: "technician",
          targetId: "legacy-id",
          valueType: "percentage",
          value: 0,
          isActive: true,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
          createdByUid: "admin",
        },
      },
    ]);

    const result = await upsertTechnicianCommissionRuleAdmin(db, "co-1", {
      technicianUid: "auth-uid",
      alternateTargetIds: ["legacy-id"],
      valueType: "percentage",
      value: 18,
      byUid: "admin",
    });

    expect(result.value).toBe(18);
    expect(store.get("legacy")?.targetId).toBe("auth-uid");
    expect(store.get("legacy")?.value).toBe(18);
  });
});
