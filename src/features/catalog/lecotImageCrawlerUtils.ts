import { fetchLecotProductPageImage } from "@/features/catalog/lecotProductPageImage";

const pageImageCache = new Map<string, string | null>();

export async function fetchPageImageCached(pageUrl: string): Promise<string | null> {
  if (pageImageCache.has(pageUrl)) return pageImageCache.get(pageUrl) ?? null;
  const imageUrl = await fetchLecotProductPageImage(pageUrl);
  pageImageCache.set(pageUrl, imageUrl);
  return imageUrl;
}

export function clearLecotPageImageCache(): void {
  pageImageCache.clear();
}

export const HTML_FETCH_HEADERS = {
  Accept: "text/html,application/xhtml+xml",
  "User-Agent": "Mozilla/5.0 (compatible; CrmslotImageCrawler/1.0) AppleWebKit/537.36",
};

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]!, index);
    }
  }

  const workers = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workers }, () => worker()));
  return results;
}

export function isPlaceholder(url: string): boolean {
  return /\/placeholder\/default\//i.test(url);
}

const RETRYABLE_STATUS = new Set([429, 503]);

export async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  attempts = 4
): Promise<Response> {
  let last: Response | null = null;
  for (let i = 0; i < attempts; i += 1) {
    last = await fetch(url, init);
    if (!RETRYABLE_STATUS.has(last.status)) return last;
    const delayMs = Math.min(8000, 400 * 2 ** i);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return last!;
}
