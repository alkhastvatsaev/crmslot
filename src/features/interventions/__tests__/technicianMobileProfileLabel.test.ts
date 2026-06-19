import {
  resolveTechnicianProfileFirstName,
  technicianFirstNameTextClass,
} from "@/features/interventions/technicianMobileProfileLabel";

describe("technicianMobileProfileLabel", () => {
  it("picks smaller text classes for longer first names", () => {
    expect(technicianFirstNameTextClass("Ali")).toContain("15px");
    expect(technicianFirstNameTextClass("Jonathan")).toContain("text-sm");
    expect(technicianFirstNameTextClass("Christopher")).toContain("text-xs");
    expect(technicianFirstNameTextClass("Alexandrina-Marie")).toContain("10px");
  });

  it("resolves first name from profile, then email local part", () => {
    expect(resolveTechnicianProfileFirstName("Jean", "", "—")).toBe("Jean");
    expect(resolveTechnicianProfileFirstName("", "jean@example.com", "—")).toBe("jean");
    expect(resolveTechnicianProfileFirstName("", "", "—")).toBe("—");
  });
});
