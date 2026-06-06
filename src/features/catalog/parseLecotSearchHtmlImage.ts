import { lecotShopOrigin } from "@/features/catalog/lecotShopConfig";
import type { LecotSearchProductHit } from "@/features/catalog/lecotProductImageMatch";

export function absolutizeLecotImageUrl(raw: string, origin = lecotShopOrigin()): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:") || trimmed.includes("placeholder")) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  try {
    return new URL(trimmed, origin).href;
  } catch {
    return null;
  }
}

function readAttr(block: string, name: string): string {
  const re = new RegExp(`${name}=["']([^"']+)["']`, "i");
  return block.match(re)?.[1]?.trim() ?? "";
}

function readText(block: string, classHint: string): string {
  const re = new RegExp(`class="[^"]*${classHint}[^"]*"[^>]*>([^<]+)`, "i");
  return block.match(re)?.[1]?.trim() ?? "";
}

/** Parse une page recherche Magento lecot.be → hits structurés (SKU + image). */
export function parseLecotSearchHtmlProducts(
  html: string,
  origin = lecotShopOrigin()
): LecotSearchProductHit[] {
  const hits: LecotSearchProductHit[] = [];
  const blocks = html.split(/<li[^>]*class="[^"]*product-item[^"]*"/i);

  for (const block of blocks.slice(1)) {
    const sku =
      readAttr(block, "data-product-sku") ||
      readText(block, "product-item-sku") ||
      readText(block, "sku");
    const label = readText(block, "product-item-link") || readText(block, "product-item-name");
    const rawImage =
      (block.match(/product-image-photo[^>]*\sdata-src="([^"]+)"/i)?.[1] ?? "") ||
      readAttr(block, "data-src") ||
      (block.match(/class="[^"]*product-image-photo[^"]*"[^>]*\ssrc="([^"]+)"/i)?.[1] ?? "") ||
      (block.match(/src="([^"]+\/media\/catalog\/product\/[^"]+)"/i)?.[1] ?? "");

    const rawPage =
      readAttr(block, "href") ||
      (block.match(/class="[^"]*product-item-link[^"]*"[^>]*href="([^"]+)"/i)?.[1] ?? "") ||
      (block.match(/class="[^"]*product-item-photo[^"]*"[^>]*href="([^"]+)"/i)?.[1] ?? "");
    let pageUrl: string | null = null;
    if (rawPage) {
      try {
        pageUrl = new URL(rawPage, origin).href;
      } catch {
        pageUrl = null;
      }
    }

    const imageUrl = absolutizeLecotImageUrl(rawImage, origin);
    if (!sku || !imageUrl) continue;

    hits.push({ sku, label, imageUrl, pageUrl });
  }

  return hits;
}
