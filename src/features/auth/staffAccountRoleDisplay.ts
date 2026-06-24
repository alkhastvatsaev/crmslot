import type { CompanyRole } from "@/features/company";

/** Rôles sélectionnables dans le panneau compte staff (valeur Firestore inchangée). */
export const STAFF_ACCOUNT_ROLE_OPTIONS: readonly CompanyRole[] = ["admin", "collaborateur"];

/** Clé i18n `profiles.roles.*` pour le badge profil. */
export function resolveStaffProfileRoleKey(roleLabel: string | null | undefined): string {
  if (roleLabel === "admin") return "admin";
  if (roleLabel === "collaborateur") return "back_office";
  return roleLabel?.trim() || "back_office";
}

/** Libellé du sélecteur rôle (`staff_account.*`). */
export function staffAccountRoleOptionLabelKey(role: CompanyRole): string {
  return role === "admin" ? "staff_account.role_admin" : "staff_account.role_dispatcher";
}
