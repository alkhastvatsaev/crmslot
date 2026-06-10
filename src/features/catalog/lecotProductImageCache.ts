const TTL_MS = 24 * 60 * 60 * 1000;

type CacheEntry = { value: string | null; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function normalizeLecotImageLookupKey(raw: string): string {
  return raw.trim().toLowerCase();
}

export function getCachedLecotProductImage(key: string): string | null | undefined {
  const entry = cache.get(normalizeLecotImageLookupKey(key));
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(normalizeLecotImageLookupKey(key));
    return undefined;
  }
  return entry.value;
}

export function setCachedLecotProductImage(key: string, value: string | null): void {
  cache.set(normalizeLecotImageLookupKey(key), {
    value,
    expiresAt: Date.now() + TTL_MS,
  });
}

/** Tests uniquement. */
export function clearLecotProductImageCache(): void {
  cache.clear();
}
