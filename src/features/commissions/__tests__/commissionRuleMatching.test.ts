import { pickPersonalTechnicianRule } from "@/features/commissions/commissionRuleMatching";
import type { CommissionRule } from "@/features/commissions/types";

const base = (patch: Partial<CommissionRule>): CommissionRule => ({
  id: "x",
  companyId: "co-1",
  isActive: true,
  level: "technician",
  targetId: "legacy-id",
  valueType: "percentage",
  value: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdByUid: "admin",
  ...patch,
});

describe("commissionRuleMatching", () => {
  it("prefers auth uid rule over older legacy duplicate at 0%", () => {
    const rules = [
      base({
        id: "legacy",
        targetId: "legacy-id",
        value: 0,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      base({
        id: "current",
        targetId: "auth-uid",
        value: 14,
        updatedAt: "2026-06-20T00:00:00.000Z",
      }),
    ];

    expect(pickPersonalTechnicianRule(rules, "auth-uid", ["legacy-id"])?.value).toBe(14);
  });
});
