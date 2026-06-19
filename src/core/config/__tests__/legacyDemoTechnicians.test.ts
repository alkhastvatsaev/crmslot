import {
  isLegacyDemoTechnician,
  stripLegacyDemoTechnicians,
} from "@/core/config/legacyDemoTechnicians";

describe("legacyDemoTechnicians", () => {
  it("flags legacy seed ids and demo names", () => {
    expect(isLegacyDemoTechnician({ id: "1", name: "Anyone" })).toBe(true);
    expect(isLegacyDemoTechnician({ id: "x", name: "Alexandre V." })).toBe(true);
    expect(isLegacyDemoTechnician({ id: "x", displayName: "Thomas L" })).toBe(true);
    expect(isLegacyDemoTechnician({ id: "x", name: "Boris K." })).toBe(true);
    expect(isLegacyDemoTechnician({ id: "mansour", name: "Mansour" })).toBe(false);
  });

  it("strips legacy rows from lists", () => {
    const rows = stripLegacyDemoTechnicians([
      { id: "1", name: "Alexandre V." },
      { id: "mansour", name: "Mansour" },
      { uid: "2", displayName: "Thomas L." },
    ]);
    expect(rows).toEqual([{ id: "mansour", name: "Mansour" }]);
  });
});
