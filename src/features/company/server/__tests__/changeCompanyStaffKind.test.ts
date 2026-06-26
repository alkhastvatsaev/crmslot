/**
 * @jest-environment node
 */
import * as admin from "firebase-admin";
import { changeCompanyStaffKind } from "@/features/company/server/changeCompanyStaffKind";

jest.mock("@/features/company/server/provisionTechnicianStaff", () => ({
  provisionTechnicianStaffRecord: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/company/server/companyStaffDirectory", () => ({
  upsertCompanyStaffDirectoryEntry: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/features/company/server/syncTenantClaims", () => ({
  syncTenantClaims: jest.fn().mockResolvedValue(undefined),
}));

const { provisionTechnicianStaffRecord } = jest.requireMock(
  "@/features/company/server/provisionTechnicianStaff"
) as { provisionTechnicianStaffRecord: jest.Mock };

describe("changeCompanyStaffKind", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passe un technicien en dispatcher en désactivant le profil terrain", async () => {
    const membershipUpdate = jest.fn().mockResolvedValue(undefined);
    const techSet = jest.fn().mockResolvedValue(undefined);
    const membershipRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "collaborateur" }),
      }),
      update: membershipUpdate,
    };
    const techRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ companyId: "co-abc", active: true }),
      }),
      set: techSet,
    };

    const db = {
      doc: jest.fn((path: string) => {
        if (path === "users/uid-tech-1/company_memberships/co-abc") return membershipRef;
        throw new Error(path);
      }),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return { doc: jest.fn(() => techRef) };
        }
        throw new Error(name);
      }),
    };

    const result = await changeCompanyStaffKind(
      db as never,
      jest.fn() as never,
      "co-abc",
      "uid-tech-1",
      "dispatcher",
      { firstName: "Jean", lastName: "Martin", email: "jean@abc.be" }
    );

    expect(result).toEqual({ ok: true });
    expect(provisionTechnicianStaffRecord).not.toHaveBeenCalled();
    expect(techSet).toHaveBeenCalledWith(
      expect.objectContaining({ active: false }),
      expect.objectContaining({ merge: true })
    );
  });

  it("passe un dispatcher en technicien en provisionnant le profil terrain", async () => {
    const techSet = jest.fn().mockResolvedValue(undefined);
    const membershipRef = {
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({ role: "collaborateur" }),
      }),
      update: jest.fn(),
    };
    const techRef = {
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: techSet,
    };

    const db = {
      doc: jest.fn((path: string) => {
        if (path === "users/uid-dispatch-1/company_memberships/co-abc") return membershipRef;
        throw new Error(path);
      }),
      collection: jest.fn((name: string) => {
        if (name === "technicians") {
          return { doc: jest.fn(() => techRef) };
        }
        throw new Error(name);
      }),
    };

    const result = await changeCompanyStaffKind(
      db as never,
      admin.auth as never,
      "co-abc",
      "uid-dispatch-1",
      "technician",
      { firstName: "Marie", lastName: "Dupont", email: "marie@abc.be" }
    );

    expect(result).toEqual({ ok: true });
    expect(provisionTechnicianStaffRecord).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        uid: "uid-dispatch-1",
        companyId: "co-abc",
      })
    );
    expect(techSet).toHaveBeenCalledWith(
      expect.objectContaining({ active: true }),
      expect.objectContaining({ merge: true })
    );
  });
});
