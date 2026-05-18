import {
  technicianHasRequiredSkills,
  missingSkills,
} from "@/features/technicians/skillConstants";

describe("technicianHasRequiredSkills", () => {
  it("returns true when no skills required", () => {
    expect(technicianHasRequiredSkills([], [])).toBe(true);
    expect(technicianHasRequiredSkills(null, null)).toBe(true);
    expect(technicianHasRequiredSkills(["serrurerie"], undefined)).toBe(true);
  });

  it("returns false when tech has no skills but skills are required", () => {
    expect(technicianHasRequiredSkills(null, ["serrurerie"])).toBe(false);
    expect(technicianHasRequiredSkills([], ["serrurerie"])).toBe(false);
  });

  it("returns true when tech has all required skills", () => {
    expect(
      technicianHasRequiredSkills(["serrurerie", "plomberie"], ["serrurerie"]),
    ).toBe(true);
  });

  it("returns false when tech is missing a required skill", () => {
    expect(
      technicianHasRequiredSkills(["serrurerie"], ["serrurerie", "electricite"]),
    ).toBe(false);
  });
});

describe("missingSkills", () => {
  it("returns empty array when no skills required", () => {
    expect(missingSkills(["serrurerie"], [])).toEqual([]);
    expect(missingSkills(null, undefined)).toEqual([]);
  });

  it("returns all required skills when tech has none", () => {
    expect(missingSkills(null, ["serrurerie", "plomberie"])).toEqual([
      "serrurerie",
      "plomberie",
    ]);
  });

  it("returns only missing skills", () => {
    expect(missingSkills(["serrurerie", "gaz"], ["serrurerie", "plomberie"])).toEqual([
      "plomberie",
    ]);
  });
});
