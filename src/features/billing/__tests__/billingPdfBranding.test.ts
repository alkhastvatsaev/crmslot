import { resolveBillingPdfBrandingFromCompany } from "@/features/billing/billingPdfBranding";

describe("billingPdfBranding", () => {
  it("reads company fields for stamp and signer", () => {
    const partial = resolveBillingPdfBrandingFromCompany(
      {
        name: "Serrurerie Dupont",
        billingSignerName: "Jean Dupont",
        city: "Liège",
        billingStampUrl: "https://example.com/stamp.png",
        billingSignatureUrl: "data:image/png;base64,abc",
      },
      "co-1",
    );
    expect(partial.companyName).toBe("Serrurerie Dupont");
    expect(partial.signerName).toBe("Jean Dupont");
    expect(partial.placeName).toBe("Liège");
    expect(partial.stampSourceUrl).toBe("https://example.com/stamp.png");
    expect(partial.signatureSourceUrl).toContain("base64");
  });
});
