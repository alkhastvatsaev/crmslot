import { assertCompanyStaffAccess } from "@/features/company/server/assertCompanyStaffAccess";

const mockDb = {
  doc: jest.fn(() => ({ get: jest.fn() })),
} as unknown as import("firebase-admin").firestore.Firestore;

jest.mock("@/features/backoffice/assignInterventionServerAuth", () => ({
  assertCanAssignInterventionServer: jest.fn(),
}));

import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";

describe("assertCompanyStaffAccess", () => {
  beforeEach(() => {
    jest.mocked(assertCanAssignInterventionServer).mockReset();
  });

  it("rejects empty companyId", async () => {
    const result = await assertCompanyStaffAccess(mockDb, "uid-1", "  ", {
      uid: "uid-1",
    } as import("firebase-admin").auth.DecodedIdToken);
    expect(result).toEqual({ ok: false, status: 400, error: "companyId requis." });
  });

  it("rejects when assign check fails", async () => {
    jest.mocked(assertCanAssignInterventionServer).mockResolvedValue(false);
    const result = await assertCompanyStaffAccess(mockDb, "uid-1", "co-1", {
      uid: "uid-1",
    } as import("firebase-admin").auth.DecodedIdToken);
    expect(result).toEqual({ ok: false, status: 403, error: "Accès société refusé." });
  });

  it("allows staff member", async () => {
    jest.mocked(assertCanAssignInterventionServer).mockResolvedValue(true);
    const result = await assertCompanyStaffAccess(mockDb, "uid-1", "co-1", {
      uid: "uid-1",
    } as import("firebase-admin").auth.DecodedIdToken);
    expect(result).toEqual({ ok: true });
  });
});
