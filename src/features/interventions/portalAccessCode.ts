const PORTAL_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePortalAccessCode(length = 8): string {
  const size = Math.max(6, Math.min(length, 12));
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => PORTAL_CODE_ALPHABET[b % PORTAL_CODE_ALPHABET.length]!).join(
      ""
    );
  }
  let out = "";
  for (let i = 0; i < size; i += 1) {
    out += PORTAL_CODE_ALPHABET[Math.floor(Math.random() * PORTAL_CODE_ALPHABET.length)]!;
  }
  return out;
}

export function normalizePortalAccessCode(raw: string): string {
  return raw.replace(/[\s-]/g, "").toUpperCase();
}

export function formatPortalAccessCode(code: string): string {
  const normalized = normalizePortalAccessCode(code);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, 4)} ${normalized.slice(4, 8)}`.trim();
}

export function isValidPortalAccessCode(code: string): boolean {
  const normalized = normalizePortalAccessCode(code);
  return normalized.length >= 6 && normalized.length <= 12;
}
