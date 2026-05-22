import { coerceAdminExtraPatch } from "@/features/interventions/workflow/coerceAdminExtraPatch";

jest.mock("firebase-admin", () => ({
  firestore: {
    Timestamp: {
      fromDate: (d: Date) => ({ _seconds: Math.floor(d.getTime() / 1000) }),
    },
  },
}));

describe("coerceAdminExtraPatch", () => {
  it("converts completedAt ISO string to Timestamp", () => {
    const iso = "2026-05-20T12:00:00.000Z";
    const out = coerceAdminExtraPatch({ completedAt: iso, completedByUid: "tech-1" });
    expect(out?.completedAt).toEqual({ _seconds: Math.floor(new Date(iso).getTime() / 1000) });
    expect(out?.completedByUid).toBe("tech-1");
  });

  it("strips undefined fields", () => {
    const out = coerceAdminExtraPatch({ billingLines: undefined, completedByUid: "x" });
    expect(out).toEqual({ completedByUid: "x" });
  });
});
