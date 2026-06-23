import type { Intervention } from "@/features/interventions";

const STORAGE_PREFIX = "crmslot_admin_iv_detail_";
const MAX_ENTRIES = 40;

export function adminInterventionDetailCacheKey(interventionId: string): string {
  return `${STORAGE_PREFIX}${interventionId.trim()}`;
}

export function readAdminInterventionDetailCache(interventionId: string): Intervention | null {
  if (typeof window === "undefined" || !interventionId.trim()) return null;
  try {
    const raw = localStorage.getItem(adminInterventionDetailCacheKey(interventionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const row = parsed as Intervention;
    return row.id?.trim() ? row : null;
  } catch {
    return null;
  }
}

export function writeAdminInterventionDetailCache(intervention: Intervention): void {
  if (typeof window === "undefined") return;
  const id = intervention.id?.trim();
  if (!id) return;
  try {
    localStorage.setItem(adminInterventionDetailCacheKey(id), JSON.stringify(intervention));
    pruneAdminInterventionDetailCache();
  } catch {
    /* quota */
  }
}

function pruneAdminInterventionDetailCache(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  if (keys.length <= MAX_ENTRIES) return;
  keys.sort();
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) {
    localStorage.removeItem(key);
  }
}
