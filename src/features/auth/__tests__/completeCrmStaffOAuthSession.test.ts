import { getAdditionalUserInfo, deleteUser, signOut } from "firebase/auth";
import {
  CrmStaffOAuthModeError,
  completeCrmStaffOAuthSession,
} from "@/features/auth/crmEmailRegister";

describe("completeCrmStaffOAuthSession", () => {
  const user = { getIdToken: jest.fn().mockResolvedValue("token-1") };
  const cred = { user } as never;
  const mockAuth = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("register mode: joins default company for new OAuth users", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: true });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });

    const outcome = await completeCrmStaffOAuthSession(cred, "register", mockAuth);
    expect(outcome).toBe("register");
    expect(global.fetch).toHaveBeenCalledWith("/api/company/join-default", {
      method: "POST",
      headers: { Authorization: "Bearer token-1" },
    });
  });

  it("login mode: syncs membership for returning OAuth users", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: false });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });

    const outcome = await completeCrmStaffOAuthSession(cred, "login", mockAuth);
    expect(outcome).toBe("login");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("login mode: rejects new users and deletes the Firebase account", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: true });

    await expect(completeCrmStaffOAuthSession(cred, "login", mockAuth)).rejects.toBeInstanceOf(
      CrmStaffOAuthModeError
    );
    expect(deleteUser).toHaveBeenCalledWith(user);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("register mode: rejects existing users and signs out", async () => {
    (getAdditionalUserInfo as jest.Mock).mockReturnValueOnce({ isNewUser: false });

    await expect(completeCrmStaffOAuthSession(cred, "register", mockAuth)).rejects.toBeInstanceOf(
      CrmStaffOAuthModeError
    );
    expect(signOut).toHaveBeenCalledWith(mockAuth);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
