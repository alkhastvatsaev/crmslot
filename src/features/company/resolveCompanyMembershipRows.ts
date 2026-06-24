import type { CompanyMembershipRow, CompanyRole } from "@/features/company/types";
import { readClientPortalDefaultCompanyIdFromEnv } from "@/features/company/clientPortalCompanyId";

export type MembershipDocSnapshot = {
  companyId: string;
  role: CompanyRole;
  /** Nom copié à l'adhésion — peut être périmé si la société a été renommée. */
  fallbackName: string;
};

export type CompanyLiveState = "pending" | "missing" | { name: string };

/** Libellé UI phase test (id Firestore peut rester l'ancien « ABC »). */
export const TEST_COMPANY_DISPLAY_NAME = "AntwerpenSlot";

/** Nom affiché — masque les anciens libellés « ABC » tout en gardant le même companyId. */
export function resolveCompanyMembershipDisplayName(companyId: string, rawName: string): string {
  const envId = readClientPortalDefaultCompanyIdFromEnv();
  if (envId && companyId.trim() === envId) return TEST_COMPANY_DISPLAY_NAME;

  const name = rawName.trim();
  if (!name || name === "ABC" || /^société abc$/i.test(name)) return TEST_COMPANY_DISPLAY_NAME;
  return name;
}

/** Fusionne memberships utilisateur + nom live `companies/{id}`. */
export function mergeCompanyMembershipRows(
  memberships: readonly MembershipDocSnapshot[],
  companyById: ReadonlyMap<string, CompanyLiveState>
): CompanyMembershipRow[] {
  const rows: CompanyMembershipRow[] = [];

  for (const membership of memberships) {
    const live = companyById.get(membership.companyId);
    const rawName =
      live && live !== "pending" && live !== "missing" && live.name.trim()
        ? live.name.trim()
        : membership.fallbackName.trim() || "Sans nom";

    rows.push({
      companyId: membership.companyId,
      role: membership.role,
      companyName: resolveCompanyMembershipDisplayName(membership.companyId, rawName),
    });
  }

  return rows;
}

/** Liste UI quand l'utilisateur n'a encore aucune membership résolue (boot / rattachement). */
export function appendEnvDefaultMembershipFallback(
  rows: readonly CompanyMembershipRow[]
): CompanyMembershipRow[] {
  if (rows.length > 0) return [...rows];
  const envId = readClientPortalDefaultCompanyIdFromEnv();
  if (!envId) return [];
  return [
    {
      companyId: envId,
      role: "collaborateur",
      companyName: TEST_COMPANY_DISPLAY_NAME,
    },
  ];
}

export function pickActiveCompanyId(
  rows: readonly CompanyMembershipRow[],
  preferred: string,
  stored: string,
  liveById?: ReadonlyMap<string, CompanyLiveState>
): string {
  const ids = new Set(rows.map((r) => r.companyId));
  const isUsable = (id: string) => {
    if (!id || !ids.has(id)) return false;
    if (!liveById) return true;
    return liveById.get(id) !== "missing";
  };

  const preferredTrimmed = preferred.trim();
  if (isUsable(preferredTrimmed)) return preferredTrimmed;

  const storedTrimmed = stored.trim();
  if (isUsable(storedTrimmed)) return storedTrimmed;

  const firstWithLiveCompany = rows.find((row) => liveById?.get(row.companyId) !== "missing");
  if (firstWithLiveCompany) return firstWithLiveCompany.companyId;

  return rows[0]?.companyId ?? "";
}
