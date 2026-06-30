import { fetchWithAuth } from "@/core/api/fetchWithAuth";
import type { CompanyStaffMember } from "@/features/teamHub/types";

function sortStaff(members: CompanyStaffMember[]): CompanyStaffMember[] {
  return [...members].sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
}

type CacheEntry = {
  staff: CompanyStaffMember[];
  inflight?: Promise<CompanyStaffMember[] | null>;
};

const cacheByCompanyId = new Map<string, CacheEntry>();

export function readCompanyStaffCache(
  companyId: string | null | undefined
): CompanyStaffMember[] | null {
  const id = companyId?.trim();
  if (!id) return null;
  const entry = cacheByCompanyId.get(id);
  if (!entry || entry.inflight) return null;
  return entry.staff;
}

async function fetchCompanyStaff(companyId: string): Promise<CompanyStaffMember[] | null> {
  const res = await fetchWithAuth(`/api/company/staff?companyId=${encodeURIComponent(companyId)}`);
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    staff?: CompanyStaffMember[];
    error?: string;
  };
  if (!res.ok || !data.ok || !Array.isArray(data.staff)) {
    throw new Error(data.error?.trim() || "Impossible de charger l'équipe.");
  }
  const staff = sortStaff(data.staff);
  cacheByCompanyId.set(companyId, { staff });
  return staff;
}

/** Précharge la liste staff — navigation équipe / boot dashboard. */
export function prefetchCompanyStaff(companyId: string | null | undefined): void {
  const id = companyId?.trim();
  if (!id) return;

  const existing = cacheByCompanyId.get(id);
  if (existing && !existing.inflight) return;

  const inflight = fetchCompanyStaff(id)
    .catch(() => null)
    .finally(() => {
      const entry = cacheByCompanyId.get(id);
      if (entry?.inflight === inflight) {
        cacheByCompanyId.set(id, { staff: entry.staff ?? [] });
      }
    });

  cacheByCompanyId.set(id, { staff: existing?.staff ?? [], inflight });
}

export async function loadCompanyStaffCached(
  companyId: string,
  options?: { force?: boolean }
): Promise<{ staff: CompanyStaffMember[]; fromCache: boolean }> {
  if (!options?.force) {
    const cached = readCompanyStaffCache(companyId);
    if (cached) return { staff: cached, fromCache: true };
  }

  const entry = cacheByCompanyId.get(companyId);
  if (entry?.inflight) {
    const staff = await entry.inflight;
    if (staff) return { staff, fromCache: false };
  }

  const staff = await fetchCompanyStaff(companyId);
  return { staff: staff ?? [], fromCache: false };
}

export function upsertCompanyStaffCacheMember(companyId: string, member: CompanyStaffMember): void {
  const id = companyId.trim();
  if (!id) return;
  const entry = cacheByCompanyId.get(id);
  const prev = entry?.staff ?? [];
  cacheByCompanyId.set(id, {
    staff: sortStaff([...prev.filter((row) => row.uid !== member.uid), member]),
  });
}
