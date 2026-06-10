import { lookupClientLecotProductImageOverlay } from "@/features/catalog/lecotProductImageClientOverlay";

describe("lecotProductImageClientOverlay", () => {
  it("resolves by lecot sku", () => {
    expect(
      lookupClientLecotProductImageOverlay({
        reference: "UNKNOWN",
        lecotSku: "LEC-SER-1014",
      })
    ).toMatch(/^https:\/\/lecot\.be\//);
  });

  it("resolves by reference", () => {
    expect(
      lookupClientLecotProductImageOverlay({
        reference: "SERR-APL",
      })
    ).toMatch(/^https:\/\/lecot\.be\//);
  });

  it("returns null when unknown", () => {
    expect(
      lookupClientLecotProductImageOverlay({
        reference: "NO-SUCH-REF",
      })
    ).toBeNull();
  });
});
