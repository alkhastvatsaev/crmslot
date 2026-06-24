import {
  resolveStaffProfileRoleKey,
  staffAccountRoleOptionLabelKey,
} from "@/features/auth/staffAccountRoleDisplay";

describe("staffAccountRoleDisplay", () => {
  it("maps collaborateur to dispatcher profile badge key", () => {
    expect(resolveStaffProfileRoleKey("collaborateur")).toBe("back_office");
  });

  it("uses dispatcher label key for non-admin role option", () => {
    expect(staffAccountRoleOptionLabelKey("collaborateur")).toBe("staff_account.role_dispatcher");
    expect(staffAccountRoleOptionLabelKey("admin")).toBe("staff_account.role_admin");
  });
});
