import type { Intervention } from "@/features/interventions";

const STORAGE_PREFIX = "crmslot_admin_inbox_";

/** Clé stable — même format que `companyScopeKey` back-office. */
export function adminInboxCacheKey(companyScopeKey: string): string {
  return `${STORAGE_PREFIX}${companyScopeKey.trim()}`;
}

export function readAdminInboxInterventionsCache(companyScopeKey: string): Intervention[] {
  if (typeof window === "undefined" || !companyScopeKey.trim()) return [];
  try {
    const raw = localStorage.getItem(adminInboxCacheKey(companyScopeKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Intervention[]) : [];
  } catch {
    return [];
  }
}

export function writeAdminInboxInterventionsCache(
  companyScopeKey: string,
  interventions: Intervention[]
): void {
  if (typeof window === "undefined" || !companyScopeKey.trim()) return;
  try {
    localStorage.setItem(
      adminInboxCacheKey(companyScopeKey),
      JSON.stringify(interventions.slice(0, 120))
    );
  } catch {
    /* quota */
  }
}

export function splitInterventionsByCompanyIds(
  companyIds: readonly string[],
  rows: Intervention[]
): Record<string, Intervention[]> {
  const byCompany: Record<string, Intervention[]> = {};
  for (const cid of companyIds) byCompany[cid] = [];
  for (const row of rows) {
    const cid = (row.companyId ?? "").trim();
    if (cid && byCompany[cid]) byCompany[cid]!.push(row);
  }
  return byCompany;
}
