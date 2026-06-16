/**
 * UID enregistré sur l’intervention quand on assigne le technicien par défaut depuis le back-office.
 * Définir `NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID` = UID Firebase Auth du technicien.
 */
export function getDefaultAssignedTechnicianUid(): string {
  return process.env.NEXT_PUBLIC_DEFAULT_ASSIGNED_TECHNICIAN_UID?.trim() ?? "";
}
