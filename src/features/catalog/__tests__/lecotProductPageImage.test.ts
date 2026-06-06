import { extractOgImageFromProductPage } from "@/features/catalog/lecotProductPageImage";

describe("lecotProductPageImage", () => {
  it("extracts og:image from product page HTML", () => {
    const html = `
      <meta property="og:image" content="https://lecot.be/media/catalog/product/e/f/eff.jpg" />
    `;
    expect(extractOgImageFromProductPage(html)).toBe(
      "https://lecot.be/media/catalog/product/e/f/eff.jpg"
    );
  });

  it("resolves relative og:image against lecot origin", () => {
    const html = `<meta property="og:image" content="/media/catalog/product/x/y/z.jpg" />`;
    expect(extractOgImageFromProductPage(html, "https://lecot.be")).toBe(
      "https://lecot.be/media/catalog/product/x/y/z.jpg"
    );
  });

  it("returns null when og:image is missing", () => {
    expect(extractOgImageFromProductPage("<html></html>")).toBeNull();
  });

  it("skips placeholder og:image and uses gallery image", () => {
    const html = `
      <meta property="og:image" content="https://lecot.be/media/catalog/product/placeholder/default/Brand_Default_foto_200x200_1_1.png" />
      <img class="product-image-photo" data-src="https://lecot.be/media/catalog/product/2/9/2903558-036555038_foto_1.jpg" />
    `;
    expect(extractOgImageFromProductPage(html)).toBe(
      "https://lecot.be/media/catalog/product/2/9/2903558-036555038_foto_1.jpg"
    );
  });
});
