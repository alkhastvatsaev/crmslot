import {
  lookupClientProductLabelImage,
  normalizeProductLabelKey,
  resolveProductImageByOrderLabel,
} from "@/features/catalog/lecotProductLabelImage";

describe("lecotProductLabelImage", () => {
  it("normalizes label keys", () => {
    expect(normalizeProductLabelKey("Cylindre européen 80 mm sécurité")).toBe(
      "cylindre-europeen-80-mm-securite"
    );
  });

  it("resolves image from exact stock description", () => {
    expect(resolveProductImageByOrderLabel("Gâche électrique réversible")).toMatch(
      /^https:\/\/lecot\.be\//
    );
  });

  it("returns null when label is not cached", () => {
    expect(lookupClientProductLabelImage("Article inconnu xyz")).toBeNull();
    expect(resolveProductImageByOrderLabel("Article inconnu xyz")).toBeNull();
  });
});
