/**
 * @jest-environment node
 */
import { requireCompanyAdmin } from "@/features/company/server/requireCompanyAdmin";

describe("requireCompanyAdmin", () => {
  it("rejects non-admin members", async () => {
    const db = {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: "collaborateur" }),
        }),
      })),
    };

    const result = await requireCompanyAdmin(db as never, "uid-1", "co-abc");
    expect(result).toEqual({ status: 403, error: "Réservé aux administrateurs." });
  });

  it("accepts admin members", async () => {
    const db = {
      doc: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: "admin" }),
        }),
      })),
    };

    const result = await requireCompanyAdmin(db as never, "uid-1", "co-abc");
    expect(result).toEqual({ uid: "uid-1", companyId: "co-abc" });
  });
});
