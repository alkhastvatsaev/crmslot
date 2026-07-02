/**
 * @jest-environment node
 */
import { joinDefaultCompanyMembership } from "@/features/company/server/joinDefaultCompanyMembership";

const mockSetCustomUserClaims = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/features/company/server/readDefaultStaffCompanyId", () => ({
  readDefaultStaffCompanyIdFromEnv: jest.fn(() => "co-abc"),
}));

describe("joinDefaultCompanyMembership", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ email: "tech@example.com" });
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

  it("creates admin membership and syncs claims", async () => {
    const membershipSet = jest.fn();
    const companyGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "ABC" }),
    });
    const membershipGet = jest.fn().mockResolvedValue({ exists: false });
    const membershipsSnap = {
      docs: [{ id: "co-abc", data: () => ({ role: "admin" }) }],
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
        if (path === "users") {
          return {
            doc: jest.fn(() => ({
              set: jest.fn().mockResolvedValue(undefined),
            })),
          };
        }
        throw new Error(`unexpected collection ${path}`);
      }),
      doc: jest.fn(() => ({
        get: membershipGet,
        set: membershipSet,
      })),
    };

    const auth = jest.fn(() => ({
      setCustomUserClaims: mockSetCustomUserClaims,
      getUser: mockGetUser,
    }));

    const result = await joinDefaultCompanyMembership(
      db as never,
      auth as unknown as typeof import("firebase-admin/auth").getAuth,
      "uid-1"
    );

    expect(result).toEqual({ ok: true, companyId: "co-abc", alreadyMember: false });
    expect(membershipSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "admin",
        companyName: "ABC",
      })
    );
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-1", {
      bmTenants: ["co-abc:admin"],
      bmActive: "co-abc",
    });
  });

  it("creates collaborateur membership and technicians doc for staffKind technician", async () => {
    const membershipSet = jest.fn();
    const technicianSet = jest.fn();
    const companyGet = jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "ABC" }),
    });
    const membershipGet = jest.fn().mockResolvedValue({ exists: false });
    const technicianGet = jest.fn().mockResolvedValue({ exists: false, data: () => undefined });
    const membershipsSnap = {
      docs: [{ id: "co-abc", data: () => ({ role: "collaborateur" }) }],
    };
    const membershipsGet = jest.fn().mockResolvedValue(membershipsSnap);

    const db = {
      collection: jest.fn((path: string) => {
        if (path === "companies") {
          return { doc: jest.fn(() => ({ get: companyGet })) };
        }
        if (path === "users/uid-tech/company_memberships") {
          return { get: membershipsGet };
        }
        if (path === "technicians") {
          return {
            doc: jest.fn(() => ({
              get: technicianGet,
              set: technicianSet,
            })),
          };
        }
        if (path === "users") {
          return {
            doc: jest.fn(() => ({
              set: jest.fn().mockResolvedValue(undefined),
            })),
          };
        }
        throw new Error(`unexpected collection ${path}`);
      }),
      doc: jest.fn(() => ({
        get: membershipGet,
        set: membershipSet,
      })),
    };

    const auth = jest.fn(() => ({
      setCustomUserClaims: mockSetCustomUserClaims,
      getUser: mockGetUser,
    }));

    const result = await joinDefaultCompanyMembership(
      db as never,
      auth as unknown as typeof import("firebase-admin/auth").getAuth,
      "uid-tech",
      {
        staffKind: "technician",
        technicianProfile: { firstName: "Mansour", lastName: "Ali", email: "m@example.com" },
      }
    );

    expect(result).toEqual({ ok: true, companyId: "co-abc", alreadyMember: false });
    expect(membershipSet).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "collaborateur",
        companyName: "ABC",
      })
    );
    expect(technicianSet).toHaveBeenCalledWith(
      expect.objectContaining({
        authUid: "uid-tech",
        companyId: "co-abc",
        name: "Mansour Ali",
      })
    );
    expect(mockSetCustomUserClaims).toHaveBeenCalledWith("uid-tech", {
      bmTenants: ["co-abc:collaborateur"],
      bmActive: "co-abc",
    });
  });
});
