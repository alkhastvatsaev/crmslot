import { invoicePreviewFromIntervention } from "@/features/billing/invoicePreviewFromIntervention";

describe("invoicePreviewFromIntervention", () => {
  it("formats completedAt from ISO string", () => {
    const { invoiceDateLabel } = invoicePreviewFromIntervention({
      completedAt: "2026-06-11T14:30:00.000Z",
    });
    expect(invoiceDateLabel).toMatch(/2026/);
    expect(invoiceDateLabel).not.toMatch(/invalid/i);
  });

  it("formats completedAt from Firestore Timestamp-like object", () => {
    const { invoiceDateLabel } = invoicePreviewFromIntervention({
      completedAt: { seconds: 1749652200, nanoseconds: 0 } as unknown as string,
    });
    expect(invoiceDateLabel).toBeTruthy();
    expect(invoiceDateLabel).not.toMatch(/invalid/i);
  });

  it("returns null date label when completedAt is missing", () => {
    expect(invoicePreviewFromIntervention({}).invoiceDateLabel).toBeNull();
  });
});
