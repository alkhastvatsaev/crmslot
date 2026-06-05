import type { QueryClient } from "@tanstack/react-query";
import { patchTechnicianAssignmentInCache } from "@/features/interventions/patchTechnicianAssignmentInCache";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionFromTechnician } from "@/features/interventions/workflow/transitionInterventionFromTechnician";

/**
 * Réouverture terrain `done → in_progress`.
 *
 * Impacts attendus dans l’app (statut = source de vérité) :
 * - Hub technicien : sort des archives, barre d’actions + clôture à nouveau disponibles.
 * - Facturation / rappels « done non facturé » : plus éligible tant que pas `done` à nouveau.
 * - Back-office validation (file done/invoiced) : disparaît jusqu’à nouvelle clôture.
 * - Portail client / suivi : étape recule (in_progress).
 * - KPI « terminées aujourd’hui » : `completedAt` est effacé à la réouverture.
 * - Photos/signature de clôture : conservées (complément possible au prochain rapport).
 *
 * Bloqué si facture PDF ou statut `invoiced` (chaîne facturation engagée).
 */
export type TechnicianReopenBlockReason =
  | "wrong_status"
  | "invoiced"
  | "invoice_pdf"
  | "not_assigned";

export function canTechnicianReopenCompletedIntervention(
  iv: Pick<
    Intervention,
    | "status"
    | "invoicePdfUrl"
    | "invoicedAt"
    | "assignedTechnicianUid"
  >,
  technicianUid: string | null | undefined,
): { allowed: true } | { allowed: false; reason: TechnicianReopenBlockReason } {
  const uid = (technicianUid ?? "").trim();
  const assigned = (iv.assignedTechnicianUid ?? "").trim();

  if (iv.status !== "done") {
    return { allowed: false, reason: iv.status === "invoiced" ? "invoiced" : "wrong_status" };
  }
  if (iv.invoicedAt) {
    return { allowed: false, reason: "invoiced" };
  }
  if (typeof iv.invoicePdfUrl === "string" && iv.invoicePdfUrl.trim().length > 0) {
    return { allowed: false, reason: "invoice_pdf" };
  }
  if (!uid || !assigned || assigned !== uid) {
    return { allowed: false, reason: "not_assigned" };
  }
  return { allowed: true };
}

export const TECHNICIAN_REOPEN_I18N_KEY: Record<TechnicianReopenBlockReason, string> = {
  wrong_status: "technician_hub.dashboard.list.reopen_blocked_status",
  invoiced: "technician_hub.dashboard.list.reopen_blocked_invoiced",
  invoice_pdf: "technician_hub.dashboard.list.reopen_blocked_invoice_pdf",
  not_assigned: "technician_hub.dashboard.list.reopen_blocked_not_assigned",
};

/** Champs effacés à la réouverture : plus « terminé » + rapport terrain retiré côté back-office. */
export const TECHNICIAN_REOPEN_EXTRA_PATCH: Record<string, unknown> = {
  completedAt: null,
  completedByUid: null,
  completionPhotoUrls: [],
  completionPhotos: [],
  completionSignatureUrl: null,
};

/** Remet une intervention `done` en `in_progress` pour compléter le rapport terrain. */
export async function reopenTechnicianCompletedIntervention(params: {
  iv: Intervention;
  technicianUid: string;
  queryClient: QueryClient;
  note?: string;
}): Promise<void> {
  const { iv, technicianUid, queryClient, note } = params;
  const gate = canTechnicianReopenCompletedIntervention(iv, technicianUid);
  if (!gate.allowed) {
    throw new Error(`REOPEN_BLOCKED:${gate.reason}`);
  }

  const nowIso = new Date().toISOString();
  const optimisticPatch: Partial<Intervention> = {
    status: "in_progress",
    statusUpdatedAt: nowIso,
    completedAt: null,
    completedByUid: null,
  };
  patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, optimisticPatch);

  try {
    await transitionInterventionFromTechnician({
      interventionId: iv.id,
      iv,
      toStatus: "in_progress",
      note: note ?? "Rouverture par le technicien — complément rapport terrain",
      extraPatch: { ...TECHNICIAN_REOPEN_EXTRA_PATCH },
      writeInboxAlerts: true,
    });
  } catch (err) {
    patchTechnicianAssignmentInCache(queryClient, technicianUid, iv.id, {
      status: iv.status,
      statusUpdatedAt: iv.statusUpdatedAt,
      completedAt: iv.completedAt ?? null,
      completedByUid: iv.completedByUid ?? null,
    });
    throw err;
  }
}
