import type { BridgedTechnicianReport } from "@/context/TechnicianBackofficeReportBridgeContext";
import type { Intervention } from "@/features/interventions/types";
import { completionPhotoUrlsFromIntervention } from "@/features/interventions/completionPhotoUrls";

export function pickLatestBridgedReportForIntervention(
  reports: BridgedTechnicianReport[],
  interventionId: string,
): BridgedTechnicianReport | null {
  const matches = reports.filter((r) => r.interventionId === interventionId);
  if (matches.length === 0) return null;
  return matches.reduce((a, b) => (a.receivedAt >= b.receivedAt ? a : b));
}

/** Préfère les URLs Storage Firestore ; sinon repli sur le pont technicien (même onglet / mode démo). */
export function mergeReportCompletionMedia(
  intervention: Pick<Intervention, "completionPhotoUrls" | "completionPhotos" | "completionSignatureUrl">,
  bridged: BridgedTechnicianReport | null,
): { photoUrls: string[]; signatureUrl: string | null } {
  const fromFs = completionPhotoUrlsFromIntervention(intervention);
  const fsSig =
    typeof intervention.completionSignatureUrl === "string" &&
    intervention.completionSignatureUrl.trim() !== ""
      ? intervention.completionSignatureUrl
      : null;

  const fromBridgePhotos = (bridged?.photoDataUrls ?? []).filter(
    (u) => typeof u === "string" && u.trim() !== "",
  );
  const fromBridgeSig =
    typeof bridged?.signaturePngDataUrl === "string" && bridged.signaturePngDataUrl.trim() !== ""
      ? bridged.signaturePngDataUrl
      : null;

  return {
    photoUrls: fromFs.length > 0 ? fromFs : fromBridgePhotos,
    signatureUrl: fsSig ?? fromBridgeSig,
  };
}

/**
 * Retire le pont local quand le rapport ne doit plus apparaître dans l’onglet Rapports :
 * - dossier plus `done` (réouverture terrain) ;
 * - facturé ;
 * - ou médias déjà synchronisés sur Firestore (file « done » suffit).
 */
export function shouldDismissBridgedTerrainReport(
  intervention:
    | Pick<Intervention, "status" | "completionPhotoUrls" | "completionPhotos" | "completionSignatureUrl">
    | undefined,
): boolean {
  if (!intervention) return false;
  if (intervention.status === "invoiced") return true;
  if (intervention.status !== "done") return true;
  const photos = completionPhotoUrlsFromIntervention(intervention);
  const hasSig =
    typeof intervention.completionSignatureUrl === "string" &&
    intervention.completionSignatureUrl.trim() !== "";
  return photos.length > 0 && hasSig;
}
