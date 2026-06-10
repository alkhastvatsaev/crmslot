import {
  absolutizeLecotImageUrl,
  parseLecotSearchHtmlProducts,
} from "@/features/catalog/parseLecotSearchHtmlImage";
import {
  pickLecotProductImageHit,
  resolveLecotCatalogSku,
} from "@/features/catalog/lecotProductImageMatch";

describe("parseLecotSearchHtmlImage", () => {
  it("parses product hits with sku and image", () => {
    const html = `
      <li class="item product product-item" data-product-sku="LEC-CYL-2012">
        <a class="product-item-link">Cylindre 60x60</a>
        <img class="product-image-photo" src="https://lecot.be/media/catalog/product/c/y/cyl.jpg" />
      </li>
      <li class="item product product-item" data-product-sku="LEC-SER-1001">
        <a class="product-item-link">Serrure 3 points</a>
        <img class="product-image-photo" src="https://lecot.be/media/catalog/product/s/e/ser.jpg" />
      </li>
    `;
    const hits = parseLecotSearchHtmlProducts(html);
    expect(hits).toHaveLength(2);
    expect(pickLecotProductImageHit("LEC-CYL-2012", undefined, hits)).toBe(
      "https://lecot.be/media/catalog/product/c/y/cyl.jpg"
    );
    expect(pickLecotProductImageHit("LEC-SER-1001", undefined, hits)).toBe(
      "https://lecot.be/media/catalog/product/s/e/ser.jpg"
    );
  });

  it("does not pick first image when sku does not match", () => {
    const html = `
      <li class="item product product-item" data-product-sku="LEC-SER-1001">
        <img class="product-image-photo" src="https://lecot.be/media/catalog/product/s/e/ser.jpg" />
      </li>
    `;
    const hits = parseLecotSearchHtmlProducts(html);
    expect(pickLecotProductImageHit("LEC-CYL-2012", undefined, hits)).toBeNull();
  });

  it("absolutizes protocol-relative urls", () => {
    expect(absolutizeLecotImageUrl("//lecot.be/media/catalog/product/x.jpg")).toBe(
      "https://lecot.be/media/catalog/product/x.jpg"
    );
  });
});

describe("resolveLecotCatalogSku", () => {
  it("prefers lecotSku over internal reference", () => {
    expect(resolveLecotCatalogSku({ reference: "CYL-EURO-80", lecotSku: "LEC-CYL-2012" })).toBe(
      "LEC-CYL-2012"
    );
  });

  it("returns null for unknown internal reference without lecotSku", () => {
    expect(resolveLecotCatalogSku({ reference: "CYL-EURO-80" })).toBeNull();
  });
});
