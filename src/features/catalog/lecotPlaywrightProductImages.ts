import type { LecotSearchProductHit } from "@/features/catalog/lecotProductImageMatch";
import { launchLecotBrowser, loginLecotShop } from "@/features/catalog/lecotPlaywrightBrowser";
import {
  lecotShopCatalogSearchUrl,
  lecotShopCredentials,
  lecotShopOrigin,
} from "@/features/catalog/lecotShopConfig";

/** Hits produits lecot.be (compte pro) — SKU + vignette pour matching strict. */
export async function fetchLecotProductHitsViaPlaywright(
  query: string
): Promise<LecotSearchProductHit[] | null> {
  if (!lecotShopCredentials()) return null;

  const browser = await launchLecotBrowser();
  if (!browser) return null;

  try {
    const page = await browser.newPage();
    if (!(await loginLecotShop(page))) return null;

    await page.goto(lecotShopCatalogSearchUrl(query), {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });

    await page
      .waitForSelector(".product-item, .product-items li", { timeout: 8_000 })
      .catch(() => null);

    const origin = lecotShopOrigin();
    const hits = await page
      .$$eval(
        ".product-item, .product-items li",
        (nodes, shopOrigin) => {
          const abs = (raw: string): string => {
            const trimmed = raw.trim();
            if (!trimmed || trimmed.includes("placeholder")) return "";
            if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
            if (trimmed.startsWith("//")) return `https:${trimmed}`;
            try {
              return new URL(trimmed, shopOrigin).href;
            } catch {
              return "";
            }
          };

          return nodes
            .map((node) => {
              const skuEl = node.querySelector("[data-product-sku], .product-item-sku");
              const nameEl = node.querySelector(".product-item-name a, .product-item-link");
              const img = node.querySelector(
                "img.product-image-photo, .product-image-photo, .product-item-photo img, img[data-src]"
              ) as HTMLImageElement | null;
              const sku =
                skuEl?.textContent?.trim() ||
                (skuEl as HTMLElement | null)?.dataset?.productSku ||
                "";
              const label = nameEl?.textContent?.trim() ?? "";
              const imageUrl = abs(img?.src || img?.getAttribute("data-src") || "");
              return { sku, label, imageUrl };
            })
            .filter((row) => row.sku && row.imageUrl);
        },
        origin
      )
      .catch(() => [] as LecotSearchProductHit[]);

    return hits.length > 0 ? hits : null;
  } catch {
    return null;
  } finally {
    await browser.close();
  }
}
