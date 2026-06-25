import {
  isActiveTechnicianForCompany,
  resolveStaffAccountRoleOption,
  resolveStaffProfileRoleKey,
  staffAccountRoleToMembershipRole,
} from "@/features/auth/staffAccountRoleDisplay";

describe("staffAccountRoleDisplay", () => {
  it("mappe les rôles panneau vers membership Firestore", () => {
    expect(staffAccountRoleToMembershipRole("admin")).toBe("admin");
    expect(staffAccountRoleToMembershipRole("dispatcher")).toBe("collaborateur");
    expect(staffAccountRoleToMembershipRole("technician")).toBe("collaborateur");
  });

  it("détecte un technicien actif pour la société", () => {
    expect(isActiveTechnicianForCompany({ active: true, companyId: "co-1" }, "co-1")).toBe(true);
    expect(isActiveTechnicianForCompany({ active: true, companyId: "" }, "co-1")).toBe(true);
    expect(isActiveTechnicianForCompany({ active: false, companyId: "co-1" }, "co-1")).toBe(false);
    expect(isActiveTechnicianForCompany({ active: true, companyId: "co-2" }, "co-1")).toBe(false);
  });

  it("résout le rôle affiché", () => {
    expect(resolveStaffAccountRoleOption("admin", { active: true }, "co-1")).toBe("admin");
    expect(resolveStaffAccountRoleOption("collaborateur", { active: true }, "co-1")).toBe(
      "technician"
    );
    expect(resolveStaffAccountRoleOption("collaborateur", { active: false }, "co-1")).toBe(
      "dispatcher"
    );
    expect(resolveStaffAccountRoleOption("collaborateur", null, "co-1")).toBe("dispatcher");
  });

  it("mappe vers les clés badge profil", () => {
    expect(resolveStaffProfileRoleKey("admin")).toBe("admin");
    expect(resolveStaffProfileRoleKey("technician")).toBe("technician");
    expect(resolveStaffProfileRoleKey("dispatcher")).toBe("back_office");
  });
});
