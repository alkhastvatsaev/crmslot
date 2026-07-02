/**
 * @jest-environment node
 */
import { createCompanyStaffMember } from "@/features/company/server/createCompanyStaffMember";

const mockCreateUser = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockGeneratePasswordResetLink = jest.fn();

jest.mock("@/features/company/server/companyStaffDirectory", () => ({
  upsertCompanyStaffDirectoryEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/company/server/provisionTechnicianStaff", () => ({
  provisionTechnicianStaffRecord: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/company/server/syncTenantClaims", () => ({
  syncTenantClaims: jest.fn().mockResolvedValue(undefined),
}));

function makeDb() {
  const writes: Array<{ path: string; data: Record<string, unknown> }> = [];

  const membershipRef = {
    get: jest.fn().mockResolvedValue({ exists: false }),
    set: jest.fn().mockImplementation(async (data: Record<string, unknown>) => {
      writes.push({ path: "membership", data });
    }),
    update: jest.fn(),
  };

  const companyRef = {
    get: jest.fn().mockResolvedValue({
      exists: true,
      data: () => ({ name: "ABC Serrurerie" }),
    }),
  };

  const technicianRef = {
    set: jest.fn().mockResolvedValue(undefined),
  };

  const db = {
    collection: jest.fn((name: string) => {
      if (name === "companies") {
        return { doc: jest.fn(() => companyRef) };
      }
      if (name === "company_invites") {
        return { add: jest.fn() };
      }
      if (name === "technicians") {
        return { doc: jest.fn(() => technicianRef) };
      }
      throw new Error(name);
    }),
    doc: jest.fn((path: string) => {
      if (path.includes("company_memberships")) return membershipRef;
      throw new Error(path);
    }),
  };

  return { db, writes, membershipRef, technicianRef };
}

describe("createCompanyStaffMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserByEmail.mockRejectedValue({ code: "auth/user-not-found" });
    mockCreateUser.mockResolvedValue({ uid: "uid-new-tech" });
    mockGeneratePasswordResetLink.mockResolvedValue("https://reset.example/link");
  });

  const auth = jest.fn(() => ({
    getUserByEmail: mockGetUserByEmail,
    createUser: mockCreateUser,
    generatePasswordResetLink: mockGeneratePasswordResetLink,
  }));

  it("crée le compte Auth, le membership et provisionne le technicien", async () => {
    const { db, writes, technicianRef } = makeDb();

    const result = await createCompanyStaffMember(
      db as never,
      auth as never,
      "co-abc",
      "uid-admin",
      {
        firstName: "Jean",
        lastName: "Martin",
        email: "jean@abc.be",
        staffKind: "technician",
      }
    );

    expect(result).toMatchObject({
      ok: true,
      mode: "member",
      uid: "uid-new-tech",
      created: true,
      alreadyMember: false,
      passwordResetLink: "https://reset.example/link",
    });
    expect(mockCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: "jean@abc.be", displayName: "Jean Martin" })
    );
    expect(writes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "membership",
          data: expect.objectContaining({
            companyId: "co-abc",
            role: "collaborateur",
            active: true,
            companyName: "ABC Serrurerie",
          }),
        }),
      ])
    );

    const { provisionTechnicianStaffRecord } = jest.requireMock(
      "@/features/company/server/provisionTechnicianStaff"
    );
    expect(provisionTechnicianStaffRecord).toHaveBeenCalledWith(
      db,
      {
        uid: "uid-new-tech",
        companyId: "co-abc",
        profile: {
          firstName: "Jean",
          lastName: "Martin",
          email: "jean@abc.be",
        },
      },
      { auth }
    );
    expect(technicianRef.set).toHaveBeenCalledWith(
      expect.objectContaining({
        active: true,
        companyId: "co-abc",
      }),
      { merge: true }
    );
  });
});
