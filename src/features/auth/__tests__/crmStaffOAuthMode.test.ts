import {
  CRM_STAFF_OAUTH_MODE_KEY,
  consumeCrmStaffOAuthMode,
  peekCrmStaffOAuthMode,
  persistCrmStaffOAuthMode,
} from "@/features/auth/crmStaffOAuthMode";

describe("crmStaffOAuthMode", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("peek retourne null sans mode CRM en cours", () => {
    expect(peekCrmStaffOAuthMode()).toBeNull();
  });

  it("consume ne devine pas register sans clé explicite", () => {
    expect(consumeCrmStaffOAuthMode()).toBe("login");
    expect(window.sessionStorage.getItem(CRM_STAFF_OAUTH_MODE_KEY)).toBeNull();
  });

  it("persist puis consume enlève la clé", () => {
    persistCrmStaffOAuthMode("register");
    expect(peekCrmStaffOAuthMode()).toBe("register");
    expect(consumeCrmStaffOAuthMode()).toBe("register");
    expect(peekCrmStaffOAuthMode()).toBeNull();
  });
});
