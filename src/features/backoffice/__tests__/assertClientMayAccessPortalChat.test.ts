/**
 * @jest-environment node
 */
import { assertClientMayAccessPortalChat } from "@/features/backoffice/server/assertClientMayAccessPortalChat";
import { CLIENT_PORTAL_PROFILE_COLLECTION } from "@/features/auth";

function makeDb(
  membershipExists: boolean,
  portalCompanyId?: string,
  acceptsPublicInterventions = false
) {
  const membershipGet = jest.fn().mockResolvedValue({
    exists: membershipExists,
    data: () => ({ active: true }),
  });
  const portalGet = jest.fn().mockResolvedValue({
    exists: Boolean(portalCompanyId),
    data: () => (portalCompanyId ? { companyId: portalCompanyId } : undefined),
  });
  const companyGet = jest.fn().mockResolvedValue({
    exists: true,
    data: () => ({ acceptsPublicInterventions }),
  });

  return {
    doc: jest.fn((path: string) => {
      if (path.includes("company_memberships")) {
        return { get: membershipGet };
      }
      if (path.startsWith("companies/")) {
        return { get: companyGet };
      }
      return { get: portalGet };
    }),
    collection: jest.fn((name: string) => {
      if (name === "companies") {
        return { doc: () => ({ get: companyGet }) };
      }
      expect(name).toBe(CLIENT_PORTAL_PROFILE_COLLECTION);
      return { doc: () => ({ get: portalGet }) };
    }),
  } as unknown as FirebaseFirestore.Firestore;
}

describe("assertClientMayAccessPortalChat", () => {
  it("allows active company membership", async () => {
    const gate = await assertClientMayAccessPortalChat(makeDb(true), "uid-1", "co-1");
    expect(gate).toEqual({ allowed: true });
  });

  it("allows linked client portal profile", async () => {
    const gate = await assertClientMayAccessPortalChat(makeDb(false, "co-1"), "uid-1", "co-1");
    expect(gate).toEqual({ allowed: true });
  });

  it("allows public intervention companies without profile", async () => {
    const gate = await assertClientMayAccessPortalChat(
      makeDb(false, undefined, true),
      "uid-1",
      "co-1"
    );
    expect(gate).toEqual({ allowed: true });
  });

  it("denies when no membership nor portal link", async () => {
    const gate = await assertClientMayAccessPortalChat(makeDb(false), "uid-1", "co-1");
    expect(gate.allowed).toBe(false);
    if (!gate.allowed) expect(gate.status).toBe(403);
  });
});
