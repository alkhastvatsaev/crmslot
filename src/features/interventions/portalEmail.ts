import { normalizeEmailForDedupe } from "@/features/interventions/duplicateDetectionCore";

export function normalizePortalEmail(raw: string): string {
  return normalizeEmailForDedupe(raw.trim());
}

export function portalEmailsMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizePortalEmail(a ?? "");
  const right = normalizePortalEmail(b ?? "");
  if (!left || !right) return false;
  return left === right;
}

export function isValidPortalEmail(raw: string): boolean {
  const normalized = normalizePortalEmail(raw);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}
