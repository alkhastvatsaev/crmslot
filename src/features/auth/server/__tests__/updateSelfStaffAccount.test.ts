/** @jest-environment node */

import { updateSelfStaffAccount } from "@/features/auth/server/updateSelfStaffAccount";

const setCustomUserClaims = jest.fn().mockResolvedValue(undefined);
const membershipUpdate = jest.fn().mockResolvedValue(undefined);
const membershipGet = jest.fn();
const staffDirectorySet = jest.fn().mockResolvedValue(undefined);
const technicianSet = jest.fn().mockResolvedValue(undefined);
const technicianGet = jest.fn().mockResolvedValue({ exists: false, data: () => ({}) });
const authGetUser = jest.fn().mockResolvedValue({ email: "a@test.be", displayName: "A B" });

jest.mock("firebase-admin", () => ({
  auth: jest.fn(() => ({
    getUser: authGetUser,
    updateUser: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@/features/auth/server/selfServiceStaffRoleEdit", () => ({
  isSelfServiceStaffRoleEditEnabled: () => true,
}));

jest.mock("@/features/company/server/syncTenantClaims", () => ({
  syncTenantClaims: (...args: unknown[]) => setCustomUserClaims(...args),
}));

jest.mock("@/features/company/server/companyStaffDirectory", () => ({
  upsertCompanyStaffDirectoryEntry: (...args: unknown[]) => staffDirectorySet(...args),
}));

function makeDb() {
  return {
    doc: jest.fn((path: string) => {
      if (path.includes("company_memberships")) {
        return { get: membershipGet, update: membershipUpdate };
      }
      return { get: jest.fn() };
    }),
    collection: jest.fn((name: string) => {
      if (name === "technicians") {
        return {
          doc: () => ({ get: technicianGet, set: technicianSet }),
        };
      }
      return { doc: () => ({ set: staffDirectorySet }) };
    }),
  } as unknown as FirebaseFirestore.Firestore;
}

describe("updateSelfStaffAccount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    membershipGet.mockResolvedValue({
      exists: true,
      data: () => ({ role: "collaborateur" }),
    });
  });

  it("met à jour le rôle et synchronise les claims en phase test", async () => {
    const db = makeDb();
    const auth = jest.requireMock("firebase-admin").auth;

    const result = await updateSelfStaffAccount(db, auth, "uid-1", {
      companyId: "co-1",
      accountRole: "admin",
      firstName: "Al",
    });

    expect(result).toEqual({ ok: true });
    expect(membershipUpdate).toHaveBeenCalledWith(expect.objectContaining({ role: "admin" }));
    expect(setCustomUserClaims).toHaveBeenCalledWith(auth, db, "uid-1", "co-1");
  });
});
