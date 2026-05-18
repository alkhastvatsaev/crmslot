import {
  checklistForIntervention,
  isChecklistComplete,
} from "@/features/interventions/categoryChecklist";

describe("categoryChecklist", () => {
  it("returns serrurerie items", () => {
    const items = checklistForIntervention({ category: "serrurerie" });
    expect(items.some((i) => i.id === "lock_ok")).toBe(true);
  });

  it("requires all boxes checked", () => {
    const items = checklistForIntervention({ category: "autre" });
    expect(isChecklistComplete({ photos: true }, items)).toBe(false);
    expect(isChecklistComplete({ photos: true, site_safe: true, client_informed: true }, items)).toBe(true);
  });
});
