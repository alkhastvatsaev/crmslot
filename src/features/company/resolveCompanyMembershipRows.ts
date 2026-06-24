import type { CompanyMembershipRow, CompanyRole } from "@/features/company/types";

export type MembershipDocSnapshot = {
  companyId: string;
  role: CompanyRole;
  /** Nom copié à l'adhésion — peut être périmé si la société a été renommée. */
  fallbackName: string;
};

export type CompanyLiveState = "pending" | "missing" | { name: string };

/** Fusionne memberships utilisateur + nom live `companies/{id}` ; exclut les sociétés supprimées. */
export function mergeCompanyMembershipRows(
  memberships: readonly MembershipDocSnapshot[],
  companyById: ReadonlyMap<string, CompanyLiveState>
): CompanyMembershipRow[] {
  const rows: CompanyMembershipRow[] = [];

  for (const membership of memberships) {
    const live = companyById.get(membership.companyId);
    if (live === "missing") continue;

    const companyName =
      live && live !== "pending" && live.name.trim()
        ? live.name.trim()
        : membership.fallbackName.trim() || "Sans nom";

    rows.push({
      companyId: membership.companyId,
      role: membership.role,
      companyName,
    });
  }

  return rows;
}

export function pickActiveCompanyId(
  rows: readonly CompanyMembershipRow[],
  preferred: string,
  stored: string
): string {
  const ids = new Set(rows.map((r) => r.companyId));
  const preferredTrimmed = preferred.trim();
  if (preferredTrimmed && ids.has(preferredTrimmed)) return preferredTrimmed;

  const storedTrimmed = stored.trim();
  if (storedTrimmed && ids.has(storedTrimmed)) return storedTrimmed;

  return rows[0]?.companyId ?? "";
}
