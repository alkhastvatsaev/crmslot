import type { CompanyStaffKind, CompanyStaffMember } from "@/features/teamHub/types";

/** Déduit le rôle métier affiché depuis membership + profil terrain. */
export function resolveCompanyStaffKind(member: CompanyStaffMember): CompanyStaffKind {
  if (member.role === "admin") return "dirigeant";
  if (member.hasTechnicianProfile) return "technician";
  return "dispatcher";
}

export function companyStaffKindToMembershipRole(
  kind: CompanyStaffKind
): "admin" | "collaborateur" {
  return kind === "dirigeant" ? "admin" : "collaborateur";
}

export function companyStaffKindNeedsTechnicianProfile(kind: CompanyStaffKind): boolean {
  return kind === "technician";
}

/** Détecte e-mail vs téléphone dans un champ contact unique. */
export function parseStaffContactInput(raw: string): {
  email: string | null;
  phone: string | null;
} {
  const value = raw.trim();
  if (!value) return { email: null, phone: null };
  if (value.includes("@")) {
    return { email: value.toLowerCase(), phone: null };
  }
  return { email: null, phone: value };
}
