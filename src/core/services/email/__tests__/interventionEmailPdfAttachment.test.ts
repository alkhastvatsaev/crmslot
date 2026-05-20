import { parseAttachDocumentType } from "@/core/services/email/interventionEmailAttachOptions";

describe("interventionEmailPdfAttachment", () => {
  it("defaults to invoice", () => {
    expect(parseAttachDocumentType(undefined)).toBe("invoice");
  });

  it("allows none", () => {
    expect(parseAttachDocumentType("none")).toBe("none");
  });

  it("allows quote", () => {
    expect(parseAttachDocumentType("quote")).toBe("quote");
  });
});
