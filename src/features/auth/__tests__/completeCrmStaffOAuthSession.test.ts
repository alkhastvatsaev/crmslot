import { getAdditionalUserInfo } from "firebase/auth";
import { completeCrmStaffOAuthSession } from "@/features/auth/crmEmailRegister";

describe("completeCrmStaffOAuthSession", () => {
  const user = { getIdToken: jest.fn().mockResolvedValue("token-1") };
  const cred = { user } as never;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("joins default company for new OAuth users", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: true });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });

    await completeCrmStaffOAuthSession(cred);

    expect(global.fetch).toHaveBeenCalledWith("/api/company/join-default", {
      method: "POST",
      headers: { Authorization: "Bearer token-1" },
    });
  });

  it("syncs membership for returning OAuth users", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: false });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });

    await completeCrmStaffOAuthSession(cred);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
