import {
  DEMO_COMPANY_ID,
  DEMO_TECHNICIAN_UID,
  devUiPreviewEnabled,
} from "@/core/config/devUiPreview";

/**
 * Société fictive en prévisualisation staging/dev.
 * Les règles Firestore refusent l’utilisateur anonyme — ne pas ouvrir de listeners client.
 */
export function isDemoTenantCompanyId(companyId: string | null | undefined): boolean {
  if (!devUiPreviewEnabled) return false;
  return (companyId ?? "").trim() === DEMO_COMPANY_ID;
}

/** Technicien fictif routé en mode démo (`useTechnicianAssignments`). */
export function isDemoTechnicianPreviewUid(technicianUid: string | null | undefined): boolean {
  if (!devUiPreviewEnabled) return false;
  return (technicianUid ?? "").trim() === DEMO_TECHNICIAN_UID;
}
