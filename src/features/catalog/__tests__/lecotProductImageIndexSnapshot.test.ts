import { getLecotProductImageIndex } from "@/features/catalog/lecotProductImageIndex";
import { normalizeLecotImageLookupKey } from "@/features/catalog/lecotProductImageCache";

/** 14 SKU kit + 10 SKU catalogue figés pour snapshot de non-régression. */
const SNAPSHOT_SKUS = [
  "LEC-CYL-2012",
  "LEC-CYL-2008",
  "LEC-CYL-2013",
  "LEC-SER-1001",
  "LEC-CTL-4003",
  "LEC-SER-1014",
  "LEC-CTL-4024",
  "LEC-CTL-4048",
  "LEC-CNS-6051",
  "LEC-QUI-3060",
  "LEC-QUI-3042",
  "LEC-CNS-6037",
  "LEC-OUT-7044",
  "LEC-QUI-3001",
  "LEC-SER-1002",
  "LEC-SER-1003",
  "LEC-SER-1004",
  "LEC-SER-1005",
  "LEC-CYL-2001",
  "LEC-CYL-2002",
  "LEC-CTL-4001",
  "LEC-CTL-4002",
  "LEC-QUI-3002",
  "LEC-CNS-6001",
];

describe("product-images-index snapshot", () => {
  it("kit SKUs resolve to lecot CDN URLs", () => {
    const index = getLecotProductImageIndex();
    const kitSkus = SNAPSHOT_SKUS.slice(0, 14);

    for (const sku of kitSkus) {
      const key = normalizeLecotImageLookupKey(sku);
      const entry = index[key];
      expect(entry?.imageUrl).toMatch(/^https:\/\//);
      expect(entry?.imageUrl).not.toMatch(/placeholder\/default/i);
    }
  });

  it("snapshot shape for 24 fixed SKUs", () => {
    const index = getLecotProductImageIndex();
    const snapshot = Object.fromEntries(
      SNAPSHOT_SKUS.map((sku) => {
        const key = normalizeLecotImageLookupKey(sku);
        const entry = index[key];
        return [
          sku,
          entry
            ? {
                hasImage: true,
                source: entry.source,
                host: new URL(entry.imageUrl).hostname,
              }
            : { hasImage: false },
        ];
      })
    );

    expect(snapshot).toMatchInlineSnapshot(`
      {
        "LEC-CNS-6001": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CNS-6037": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CNS-6051": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CTL-4001": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CTL-4002": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CTL-4003": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CTL-4024": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CTL-4048": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CYL-2001": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CYL-2002": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CYL-2008": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CYL-2012": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-CYL-2013": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-OUT-7044": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-QUI-3001": {
          "hasImage": true,
          "host": "cdn.lecot.be",
          "source": "product_page",
        },
        "LEC-QUI-3002": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-QUI-3042": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-QUI-3060": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1001": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1002": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1003": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1004": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1005": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
        "LEC-SER-1014": {
          "hasImage": true,
          "host": "lecot.be",
          "source": "product_page",
        },
      }
    `);
  });
});
