/**
 * @jest-environment node
 */
import { joinDefaultCompanyMembership } from "@/features/company/server/joinDefaultCompanyMembership";

const mockSetCustomUserClaims = jest.fn();

jest.mock("@/features/company/server/readDefaultStaffCompanyId", () => ({
  readDefaultStaffCompanyIdFromEnv: jest.fn(() => "co-abc"),
}));

describe("joinDefaultCompanyMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 503 when default company id is missing", async () => {
    const { readDefaultStaffCompanyIdFromEnv } = jest.requireMock(
      "@/features/company/server/readDefaultStaffCompanyId"
    ) as { readDefaultStaffCompanyIdFromEnv: jest.Mock };
    readDefaultStaffCompanyIdFromEnv.mockReturnValueOnce("");

    const result = await joinDefaultCompanyMembership({} as never, jest.fn(), "uid-1");
    expect(result).toEqual({
      ok: false,
      status: 503,
      error: expect.stringContaining("NEXT_PUBLIC_CLIENT_PORTAL_DEFAULT_COMPANY_ID"),
    });
  });

  it("creates collaborateur membership and syncs claims", async () => {
    const membershipSet = jest.fn();
    const companyGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "ABC" }),
    });
    const membershipGet = jest.fn().mockResolvedValue({ exists: false });
    const membershipsSnap = {
      docs: [{ id: "co-abc", data: () => ({ role: "collaborateur" }) }],
    };
    const membershipsGet = jest.fn().mockResolvedValue(membershipsSnap);

    const db = {
      collection: jest.fn((path: string) => {
        if (path === "companies") {
          return { doc: jest.fn(() => ({ get: companyGet })) };
        }
        if (path === "users/uid-1/company_memberships") {
          return { get: membershipsGet };
        }
        throw new Error(`unexpected collection ${path}`);
      }),
      doc: jest.fn(() => ({
        get: membershipGet,
        set: membershipSet,
      })),
    };

    const auth = jest.fn(() => ({ setCustomUserClaims: mockSetCustomUserClaims }));

    const result = await joinDefaultCompanyMembership(db as never, auth, "uid-1");

    expect(result).toEqual({ ok: true, companyId: "co-abc", alreadyMember: false });
    expect(membershipSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "collaborateur",
        companyName: "ABC",
      })
    );
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
      bmTenants: ["co-abc:collaborateur"],
      bmActive: "co-abc",
    });
  });
});
