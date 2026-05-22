import { DEMO_COMPANY_ID } from "@/core/config/devUiPreview";
import { assertCanAssignInterventionServer } from "@/features/backoffice/assignInterventionServerAuth";

describe("assertCanAssignInterventionServer", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: "development" };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("allows demo company in dev preview", async () => {
    const db = {
      doc: jest.fn(() => ({ get: jest.fn(async () => ({ exists: false })) })),
    } as unknown as import("firebase-admin").firestore.Firestore;

    await expect(
      assertCanAssignInterventionServer(db, "anon-uid", DEMO_COMPANY_ID, {} as never),
    ).resolves.toBe(true);
  });

  it("allows admin membership on real company", async () => {
    const db = {
      doc: jest.fn(() => ({
        get: jest.fn(async () => ({ exists: true, data: () => ({ role: "admin" }) })),
      })),
    } as unknown as import("firebase-admin").firestore.Firestore;

    await expect(
      assertCanAssignInterventionServer(db, "uid-1", "co-real", { bmTenants: [] } as never),
    ).resolves.toBe(true);
  });
});
