import type { CompanyRole } from "@/features/company";

/** Rôle affiché / sélectionnable dans le panneau compte staff. */
export type StaffAccountRoleOption = "admin" | "dispatcher" | "technician";

export const STAFF_ACCOUNT_ROLE_OPTIONS: readonly StaffAccountRoleOption[] = [
  "admin",
  "dispatcher",
  "technician",
];

export function isStaffAccountRoleOption(value: unknown): value is StaffAccountRoleOption {
  return value === "admin" || value === "dispatcher" || value === "technician";
}

/** Membership Firestore (`admin` | `collaborateur`) depuis le rôle panneau compte. */
export function staffAccountRoleToMembershipRole(role: StaffAccountRoleOption): CompanyRole {
  return role === "admin" ? "admin" : "collaborateur";
}

export type TechnicianRoleProbe = {
  active?: boolean;
  companyId?: string;
};

/** Profil terrain actif pour la société (aligné sur `listCompanyStaff`). */
export function isActiveTechnicianForCompany(
  profile: TechnicianRoleProbe | null | undefined,
  companyId: string
): boolean {
  if (!profile) return false;
  if (profile.active === false) return false;
  const techCompanyId = profile.companyId?.trim() ?? "";
  const trimmedCompanyId = companyId.trim();
  if (!trimmedCompanyId) return false;
  return !techCompanyId || techCompanyId === trimmedCompanyId;
}

/** Rôle panneau compte depuis membership + profil terrain. */
export function resolveStaffAccountRoleOption(
  membershipRole: CompanyRole | null | undefined,
  technicianProfile: TechnicianRoleProbe | null | undefined,
  companyId: string
): StaffAccountRoleOption {
  if (membershipRole === "admin") return "admin";
  if (isActiveTechnicianForCompany(technicianProfile, companyId)) return "technician";
  return "dispatcher";
}

/** Clé i18n `profiles.roles.*` pour le badge profil. */
export function resolveStaffProfileRoleKey(
  accountRole: StaffAccountRoleOption | null | undefined
): string {
  if (accountRole === "admin") return "admin";
  if (accountRole === "technician") return "technician";
  return "back_office";
}

/** Libellé du sélecteur rôle (`staff_account.*`). */
export function staffAccountRoleOptionLabelKey(role: StaffAccountRoleOption): string {
  if (role === "admin") return "staff_account.role_admin";
  if (role === "technician") return "staff_account.role_technician";
  return "staff_account.role_dispatcher";
}
