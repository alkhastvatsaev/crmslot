import { isPortalInvoiceAvailable } from "@/features/company/portalInvoiceAvailability";

describe("isPortalInvoiceAvailable", () => {
  it("returns false when intervention is missing", () => {
    expect(isPortalInvoiceAvailable(null)).toBe(false);
    expect(isPortalInvoiceAvailable(undefined)).toBe(false);
  });

  it("returns true when invoice PDF URL is set", () => {
    expect(
      isPortalInvoiceAvailable({
        status: "pending",
        invoicePdfUrl: "https://storage.example/invoice.pdf",
        billingLines: [],
      })
    ).toBe(true);
  });

  it("returns true when status is invoiced", () => {
    expect(
      isPortalInvoiceAvailable({
        status: "invoiced",
        invoicePdfUrl: null,
        billingLines: [],
      })
    ).toBe(true);
  });

  it("returns true when billing lines exist", () => {
    expect(
      isPortalInvoiceAvailable({
        status: "done",
        invoicePdfUrl: null,
        billingLines: [{ description: "Main", quantity: 1, unitPriceCents: 5000 }],
      })
    ).toBe(true);
  });

  it("returns false when no billing signal yet", () => {
    expect(
      isPortalInvoiceAvailable({
        status: "pending",
        invoicePdfUrl: null,
        billingLines: [],
      })
    ).toBe(false);
  });
});
