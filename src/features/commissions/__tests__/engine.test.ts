import { calculateCommission } from "@/features/commissions/engine";
import type { CommissionRule } from "@/features/commissions/types";

const baseRules: CommissionRule[] = [
  {
    id: "g1",
    companyId: "co-1",
    isActive: true,
    level: "group",
    targetId: "co-1",
    valueType: "percentage",
    value: 10,
    createdAt: "",
    updatedAt: "",
    createdByUid: "admin",
  },
  {
    id: "t1",
    companyId: "co-1",
    isActive: true,
    level: "technician",
    targetId: "tech-1",
    valueType: "fixed_amount",
    value: 25,
    createdAt: "",
    updatedAt: "",
    createdByUid: "admin",
  },
];

describe("calculateCommission", () => {
  it("applies intervention rule first", () => {
    const rules: CommissionRule[] = [
      ...baseRules,
      {
        id: "i1",
        companyId: "co-1",
        isActive: true,
        level: "intervention",
        targetId: "iv-1",
        valueType: "percentage",
        value: 50,
        createdAt: "",
        updatedAt: "",
        createdByUid: "admin",
      },
    ];
    const result = calculateCommission(
      { interventionId: "iv-1", technicianUid: "tech-1", groupId: "co-1", baseAmount: 200 },
      rules
    );
    expect(result.finalCommissionAmount).toBe(100);
    expect(result.appliedRuleId).toBe("i1");
  });

  it("falls back to technician then group", () => {
    const techOnly = calculateCommission(
      { interventionId: "iv-2", technicianUid: "tech-1", groupId: "co-1", baseAmount: 200 },
      baseRules
    );
    expect(techOnly.finalCommissionAmount).toBe(25);
    expect(techOnly.appliedRuleId).toBe("t1");

    const groupOnly = calculateCommission(
      { interventionId: "iv-3", technicianUid: "other", groupId: "co-1", baseAmount: 200 },
      baseRules
    );
    expect(groupOnly.finalCommissionAmount).toBe(20);
    expect(groupOnly.appliedRuleId).toBe("g1");
  });

  it("falls back to the app-level 20% default when no rule matches", () => {
    const result = calculateCommission(
      { interventionId: "iv-x", technicianUid: null, groupId: null, baseAmount: 100 },
      []
    );
    expect(result.finalCommissionAmount).toBe(20);
    expect(result.appliedRuleId).toBeNull();
  });
});
