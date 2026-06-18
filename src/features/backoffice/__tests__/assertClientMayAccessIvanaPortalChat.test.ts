/**
 * @jest-environment node
 */
import { assertClientMayAccessIvanaPortalChat } from "@/features/backoffice/server/assertClientMayAccessIvanaPortalChat";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth/clientPortalConstants";

function makeDb(membershipExists: boolean, portalCompanyId?: string) {
  const membershipGet = jest.fn().mockResolvedValue({
    exists: membershipExists,
    data: () => ({ active: true }),
  });
  const portalGet = jest.fn().mockResolvedValue({
    exists: Boolean(portalCompanyId),
    data: () => (portalCompanyId ? { companyId: portalCompanyId } : undefined),
  });

  return {
    doc: jest.fn((path: string) => {
      if (path.includes("company_memberships")) {
        return { get: membershipGet };
      }
      return { get: portalGet };
    }),
    collection: jest.fn((name: string) => {
      expect(name).toBe(CLIENT_PORTAL_PROFILE_COLLECTION);
      return { doc: () => ({ get: portalGet }) };
    }),
  } as unknown as FirebaseFirestore.Firestore;
}

describe("assertClientMayAccessIvanaPortalChat", () => {
  it("allows active company membership", async () => {
    const gate = await assertClientMayAccessIvanaPortalChat(makeDb(true), "uid-1", "co-1");
    expect(gate).toEqual({ allowed: true });
  });

  it("allows linked client portal profile", async () => {
    const gate = await assertClientMayAccessIvanaPortalChat(makeDb(false, "co-1"), "uid-1", "co-1");
    expect(gate).toEqual({ allowed: true });
  });

  it("denies when no membership nor portal link", async () => {
    const gate = await assertClientMayAccessIvanaPortalChat(makeDb(false), "uid-1", "co-1");
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.status).toBe(403);
  });
});
