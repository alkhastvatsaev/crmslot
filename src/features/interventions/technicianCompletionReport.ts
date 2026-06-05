import type { Intervention } from "@/features/interventions/types";
import { completionPhotoUrlsFromIntervention } from "@/features/interventions/completionPhotoUrls";
import {
  canTechnicianReopenCompletedIntervention,
  type TechnicianReopenBlockReason,
} from "@/features/interventions/technicianReopenCompletedIntervention";
import type { BillingLine } from "@/features/interventions/components/TechnicianBillingLinesForm";

export type FinishWizardPhoto = {
  url: string;
  category: "panne" | "materiel" | "preuve" | "autre";
};

/** Même garde-fous que la réouverture : `done` non facturé, technicien assigné. */
export function canTechnicianAmendCompletionReport(
  iv: Pick<
    Intervention,
    "status" | "invoicePdfUrl" | "invoicedAt" | "assignedTechnicianUid"
  >,
  technicianUid: string | null | undefined,
): { allowed: true } | { allowed: false; reason: TechnicianReopenBlockReason } {
  return canTechnicianReopenCompletedIntervention(iv, technicianUid);
}

/** Préremplit le wizard clôture depuis le rapport déjà enregistré. */
export function finishWizardPhotosFromIntervention(
  iv: Pick<Intervention, "completionPhotos" | "completionPhotoUrls">,
): FinishWizardPhoto[] {
  if (Array.isArray(iv.completionPhotos) && iv.completionPhotos.length > 0) {
    return iv.completionPhotos
      .map((p) => ({
        url: typeof p?.url === "string" ? p.url.trim() : "",
        category:
          p?.category === "panne" ||
          p?.category === "materiel" ||
          p?.category === "preuve" ||
          p?.category === "autre"
            ? p.category
            : "preuve",
      }))
      .filter((p) => p.url.length > 0);
  }
  return completionPhotoUrlsFromIntervention(iv).map((url) => ({
    url,
    category: "preuve" as const,
  }));
}

export function finishWizardBillingLinesFromIntervention(
  iv: Pick<Intervention, "billingLines">,
): BillingLine[] {
  if (!Array.isArray(iv.billingLines)) return [];
  return iv.billingLines
    .map((l) => ({
      description: l.description ?? "",
      quantity: l.quantity ?? 1,
      unitPriceCents: l.unitPriceCents ?? 0,
      reference: l.reference ?? "",
    }))
    .filter((l) => l.description.trim().length > 0);
}
