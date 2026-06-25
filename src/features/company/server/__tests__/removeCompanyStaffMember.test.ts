import type * as admin from "firebase-admin";
import { removeCompanyStaffMember } from "@/features/company/server/removeCompanyStaffMember";

function makeDb(opts: {
  membershipExists?: boolean;
  techExists?: boolean;
  techCompanyId?: string;
}) {
  const deleted: string[] = [];
  const techSets: Record<string, unknown>[] = [];

  const membershipRef = {
    get: jest.fn().mockResolvedValue({ exists: opts.membershipExists !== false }),
    delete: jest.fn().mockImplementation(async () => {
      deleted.push("membership");
    }),
  };

  const techRef = {
    get: jest.fn().mockResolvedValue({
      exists: opts.techExists !== false,
      data: () => ({ companyId: opts.techCompanyId ?? "co-abc" }),
    }),
    set: jest.fn().mockImplementation(async (payload: Record<string, unknown>) => {
      techSets.push(payload);
    }),
  };

  const db = {
    doc: jest.fn((path: string) => {
      if (path.includes("company_memberships")) return membershipRef;
      return {
        delete: jest.fn().mockImplementation(async () => {
          deleted.push(path);
        }),
      };
    }),
    collection: jest.fn((name: string) => ({
      doc: jest.fn(() => (name === "technicians" ? techRef : membershipRef)),
    })),
  } as unknown as admin.firestore.Firestore;

  return { db, deleted, techSets, membershipRef, techRef };
}

describe("removeCompanyStaffMember", () => {
  it("refuse la suppression de son propre compte", async () => {
    const { db } = makeDb({});
    const result = await removeCompanyStaffMember(db, "co-abc", "uid-self", "uid-self");
    expect(result).toEqual({
      ok: false,
      status: 400,
      error: "Utilisez votre profil pour supprimer votre propre compte.",
    });
  });

  it("retire le membership et désactive le technicien", async () => {
    const { db, deleted, techSets, membershipRef } = makeDb({});
    const result = await removeCompanyStaffMember(db, "co-abc", "uid-tech-1", "uid-admin");
    expect(result).toEqual({ ok: true });
    expect(membershipRef.delete).toHaveBeenCalled();
    expect(deleted.some((p) => p.includes("staff_directory"))).toBe(true);
    expect(techSets[0]).toMatchObject({ active: false });
  });
});
