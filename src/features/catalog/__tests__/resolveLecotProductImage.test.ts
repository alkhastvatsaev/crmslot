import {
  clearLecotProductImageCache,
  setCachedLecotProductImage,
} from "@/features/catalog/lecotProductImageCache";
import { resolveLecotProductImage } from "@/features/catalog/resolveLecotProductImage";

describe("resolveLecotProductImage", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.LECOT_PLAYWRIGHT_SEARCH;
    clearLecotProductImageCache();
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = env;
  });

  it("returns direct imageUrl when provided", async () => {
    await expect(
      resolveLecotProductImage({
        reference: "REF-1",
        imageUrl: "https://cdn.example/p.jpg",
      })
    ).resolves.toBe("https://cdn.example/p.jpg");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uses cached value on second lookup", async () => {
    setCachedLecotProductImage("lec-cyl-2012", "https://cached.example/p.jpg");
    await expect(
      resolveLecotProductImage({
        reference: "CYL-EURO-80",
        lecotSku: "LEC-CYL-2012",
      })
    ).resolves.toBe("https://cached.example/p.jpg");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("matches sku in HTML search results only", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => `
        <li class="product-item" data-product-sku="LEC-SER-1001">
          <img class="product-image-photo" src="https://lecot.be/media/catalog/product/s/e/ser.jpg" />
        </li>
      `,
    });

    await expect(
      resolveLecotProductImage({
        reference: "TEST-REF-WRONG-SKU",
        lecotSku: "LEC-TEST-9999",
      })
    ).resolves.toBeNull();
  });

  it("returns image when lecot sku matches a search hit", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => `
        <li class="product-item" data-product-sku="LEC-TEST-8888">
          <img class="product-image-photo" src="https://lecot.be/media/catalog/product/c/y/cyl.jpg" />
        </li>
      `,
    });

    await expect(
      resolveLecotProductImage({
        reference: "TEST-REF-8888",
        lecotSku: "LEC-TEST-8888",
      })
    ).resolves.toBe("https://lecot.be/media/catalog/product/c/y/cyl.jpg");
  });

  it("resolves image from order label via stock catalogue", async () => {
    await expect(
      resolveLecotProductImage({
        reference: "A1",
        description: "Gâche électrique réversible",
      })
    ).resolves.toMatch(/^https:\/\/lecot\.be\//);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
