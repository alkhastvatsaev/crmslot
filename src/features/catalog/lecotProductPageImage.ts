import { lecotShopOrigin } from "@/features/catalog/lecotShopConfig";

const OG_IMAGE_PATTERN = /property="og:image"\s+content="([^"]+)"/i;

export function extractOgImageFromProductPage(
  html: string,
  origin = lecotShopOrigin()
): string | null {
  const match = html.match(OG_IMAGE_PATTERN);
  const raw = match?.[1]?.trim();
  if (raw && !raw.startsWith("data:") && !isPlaceholderLecotImage(raw)) {
    return absolutizeLecotPageImageUrl(raw, origin);
  }
  return extractProductGalleryImageFromPage(html, origin);
}

function isPlaceholderLecotImage(url: string): boolean {
  return /\/placeholder\/default\//i.test(url);
}

function absolutizeLecotPageImageUrl(raw: string, origin: string): string | null {
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  try {
    return new URL(raw, origin).href;
  } catch {
    return null;
  }
}

const PRODUCT_IMAGE_PATTERNS = [
  /property="og:image"\s+content="([^"]+)"/gi,
  /class="[^"]*product-image-photo[^"]*"[^>]*(?:data-src|src)="([^"]+)"/gi,
  /data-src="(https:\/\/cdn\.lecot\.be\/articles\/[^"]+)"/gi,
  /"(https:\/\/lecot\.be\/media\/catalog\/product\/[^"?]+\.(?:jpg|jpeg|png|webp))"/gi,
];

function extractProductGalleryImageFromPage(html: string, origin: string): string | null {
  for (const pattern of PRODUCT_IMAGE_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const candidate = absolutizeLecotPageImageUrl(match[1]?.trim() ?? "", origin);
      if (candidate && !isPlaceholderLecotImage(candidate)) return candidate;
    }
  }
  return null;
}

export async function fetchLecotProductPageImage(pageUrl: string): Promise<string | null> {
  const res = await fetchPageHtmlWithBackoff(pageUrl);
  if (!res?.ok) return null;
  const html = await res.text();
  return extractOgImageFromProductPage(html);
}

const RETRYABLE_STATUS = new Set([429, 503]);

async function fetchPageHtmlWithBackoff(pageUrl: string, attempts = 4): Promise<Response | null> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      last = await fetch(pageUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (compatible; BelgmapStock/1.0) AppleWebKit/537.36",
        },
      });
      if (!RETRYABLE_STATUS.has(last.status)) return last;
    } catch {
      if (i === attempts - 1) return null;
    }
    const delayMs = Math.min(8000, 400 * 2 ** i);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return last;
}
