import { normalizePhoneForDedupe } from "@/features/interventions/duplicateDetectionCore";

export function normalizePortalPhone(raw: string): string {
  return normalizePhoneForDedupe(raw.trim());
}

export function portalPhonesMatch(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizePortalPhone(a ?? "");
  const right = normalizePortalPhone(b ?? "");
  if (!left || !right) return false;
  return left === right;
}
