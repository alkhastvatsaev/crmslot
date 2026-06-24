/** @jest-environment node */

import { isSelfServiceStaffRoleEditEnabled } from "@/features/auth/server/selfServiceStaffRoleEdit";

describe("isSelfServiceStaffRoleEditEnabled", () => {
  const prevSelf = process.env.SELF_SERVICE_STAFF_ROLE_EDIT;
  const prevPublic = process.env.NEXT_PUBLIC_FF_SELF_SERVICE_STAFF_ROLE_EDIT;

  afterEach(() => {
    if (prevSelf === undefined) delete process.env.SELF_SERVICE_STAFF_ROLE_EDIT;
    else process.env.SELF_SERVICE_STAFF_ROLE_EDIT = prevSelf;
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_FF_SELF_SERVICE_STAFF_ROLE_EDIT;
    else process.env.NEXT_PUBLIC_FF_SELF_SERVICE_STAFF_ROLE_EDIT = prevPublic;
  });

  it("is enabled by default (phase test)", () => {
    delete process.env.SELF_SERVICE_STAFF_ROLE_EDIT;
    delete process.env.NEXT_PUBLIC_FF_SELF_SERVICE_STAFF_ROLE_EDIT;
    expect(isSelfServiceStaffRoleEditEnabled()).toBe(true);
  });

  it("can be disabled via SELF_SERVICE_STAFF_ROLE_EDIT=false", () => {
    process.env.SELF_SERVICE_STAFF_ROLE_EDIT = "false";
    expect(isSelfServiceStaffRoleEditEnabled()).toBe(false);
  });
});
