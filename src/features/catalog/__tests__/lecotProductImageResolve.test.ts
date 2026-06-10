import {
  lookupOverlayImageUrl,
  resolveOverlayImageKey,
} from "@/features/catalog/lecotProductImageResolve";

describe("lecotProductImageResolve", () => {
  it("resolves stock reference directly", () => {
    expect(resolveOverlayImageKey("GACH-ELEC")).toBe("gach-elec");
    expect(lookupOverlayImageUrl("GACH-ELEC")).toMatch(/^https:\/\/lecot\.be\//);
  });

  it("does not guess from generic sku aliases", () => {
    expect(resolveOverlayImageKey("A1")).toBeNull();
    expect(resolveOverlayImageKey("CYL-YALE")).toBeNull();
    expect(lookupOverlayImageUrl("A")).toBeNull();
  });

  it("does not resolve sku absent from index", () => {
    expect(resolveOverlayImageKey("LEC-INVALID-9999")).toBeNull();
    expect(resolveOverlayImageKey("NO-SUCH-SKU")).toBeNull();
  });

  it("resolves exact lecot sku present in overlay", () => {
    expect(resolveOverlayImageKey("LEC-CYL-2012")).toBe("lec-cyl-2012");
    expect(lookupOverlayImageUrl("LEC-CTL-4003")).toMatch(/^https:\/\/lecot\.be\//);
  });
});
