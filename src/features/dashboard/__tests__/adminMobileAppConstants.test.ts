import {
  ADMIN_MOBILE_APP_ROUTE,
  isAdminMobileAppPath,
} from "@/features/dashboard/adminMobileAppConstants";

describe("adminMobileAppConstants", () => {
  it("reconnaît la route admin mobile", () => {
    expect(isAdminMobileAppPath(ADMIN_MOBILE_APP_ROUTE)).toBe(true);
    expect(isAdminMobileAppPath("/m/admin/inbox")).toBe(true);
    expect(isAdminMobileAppPath("/m/technician")).toBe(false);
  });
});
