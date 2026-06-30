import { saveStaffAccountProfile } from "@/features/auth/staffAccountProfile";

jest.mock("@/core/api/fetchWithAuth", () => ({
  fetchWithAuth: jest.fn(),
}));

import { fetchWithAuth } from "@/core/api/fetchWithAuth";

const fetchWithAuthMock = fetchWithAuth as jest.MockedFunction<typeof fetchWithAuth>;

describe("saveStaffAccountProfile", () => {
  beforeEach(() => {
    fetchWithAuthMock.mockReset();
  });

  it("appelle l'API staff-profile et bascule la société active si besoin", async () => {
    fetchWithAuthMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response);

    const setActiveCompanyId = jest.fn();
    const refreshClaimsSilent = jest.fn().mockResolvedValue(true);

    await saveStaffAccountProfile(
      { uid: "uid-1" } as import("firebase/auth").User,
      {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        phone: "+32 1",
        companyId: "co-2",
        accountRole: "dispatcher",
      },
      {
        previousCompanyId: "co-1",
        setActiveCompanyId,
        refreshClaimsSilent,
      }
    );

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/account/staff-profile",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(setActiveCompanyId).toHaveBeenCalledWith("co-2");
    expect(refreshClaimsSilent).toHaveBeenCalled();
  });

  it("propage l'erreur serveur", async () => {
    fetchWithAuthMock.mockResolvedValue({
      ok: false,
      json: async () => ({ ok: false, error: "Société non autorisée." }),
    } as Response);

    await expect(
      saveStaffAccountProfile(
        { uid: "uid-1" } as import("firebase/auth").User,
        {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          phone: "",
          companyId: "co-1",
          accountRole: "dispatcher",
        },
        {
          previousCompanyId: "co-1",
          setActiveCompanyId: jest.fn(),
          refreshClaimsSilent: jest.fn(),
        }
      )
    ).rejects.toThrow("Société non autorisée.");
  });
});
