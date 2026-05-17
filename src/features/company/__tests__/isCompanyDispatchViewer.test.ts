import { isCompanyDispatchViewer } from "@/features/company/isCompanyDispatchViewer";

describe("isCompanyDispatchViewer", () => {
  it("returns true for tenant admin or collaborateur", () => {
    expect(isCompanyDispatchViewer({ isTenantUser: true, activeRole: "admin" })).toBe(true);
  });

  it("returns false without tenant role", () => {
    expect(isCompanyDispatchViewer(null)).toBe(false);
    expect(isCompanyDispatchViewer({ isTenantUser: true, activeRole: null })).toBe(false);
  });
});
