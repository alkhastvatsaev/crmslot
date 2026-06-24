/**
 * Phase test : tout membre peut changer son rôle dans Paramètres.
 * Fermer plus tard : `SELF_SERVICE_STAFF_ROLE_EDIT=false` sur Vercel.
 */
export function isSelfServiceStaffRoleEditEnabled(): boolean {
  const raw =
    process.env.SELF_SERVICE_STAFF_ROLE_EDIT?.trim().toLowerCase() ??
    process.env.NEXT_PUBLIC_FF_SELF_SERVICE_STAFF_ROLE_EDIT?.trim().toLowerCase();
  if (raw === "false" || raw === "0") return false;
  return true;
}
