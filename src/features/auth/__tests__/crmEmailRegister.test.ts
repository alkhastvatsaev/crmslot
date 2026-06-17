import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import {
  registerCrmStaffAccount,
  syncDefaultCompanyMembershipAfterLogin,
} from "@/features/auth/crmEmailRegister";

describe("registerCrmStaffAccount", () => {
  const auth = {} as never;

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("creates user, joins default company, refreshes token", async () => {
    const getIdToken = jest.fn().mockResolvedValueOnce("token-1").mockResolvedValueOnce("token-2");
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { getIdToken },
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, companyId: "co-abc" }),
    });

    const result = await registerCrmStaffAccount({
      auth,
      email: "staff@example.com",
      password: "secret12",
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      auth,
      "staff@example.com",
      "secret12"
    );
    expect(global.fetch).toHaveBeenCalledWith("/api/company/join-default", {
      method: "POST",
      headers: { Authorization: "Bearer token-1" },
    });
    expect(getIdToken).toHaveBeenCalledWith(true);
    expect(result).toEqual({ companyId: "co-abc" });
  });

  it("deletes user when join-default fails", async () => {
    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValueOnce({
      user: { getIdToken: jest.fn().mockResolvedValue("token-1") },
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false, error: "Société introuvable." }),
    });

    await expect(
      registerCrmStaffAccount({ auth, email: "staff@example.com", password: "secret12" })
    ).rejects.toThrow("Société introuvable.");

    expect(deleteUser).toHaveBeenCalled();
  });

  it("syncs default company on login without deleting user on failure", async () => {
    const user = { getIdToken: jest.fn().mockResolvedValue("token-1") };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ ok: false }),
    });

    await syncDefaultCompanyMembershipAfterLogin({ user } as never);

    expect(deleteUser).not.toHaveBeenCalled();
  });
});
