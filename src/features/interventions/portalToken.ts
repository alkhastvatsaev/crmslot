import type { Intervention } from "@/features/interventions/types";

export function generatePortalAccessToken(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export type PortalInterventionSummary = {
  id: string;
  status: Intervention["status"];
  statusUpdatedAt: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
  address: string;
  scheduledDate: string | null;
  scheduledTime: string | null;
  assignedTechnicianName: string | null;
  category: Intervention["category"];
  problem: string | null;
  createdAt: string | null;
  paymentStatus: Intervention["paymentStatus"];
  /** Montant facturé en centimes (affiché au client une fois facturé). */
  invoiceAmountCents: number | null;
  /** URL de paiement hébergée Stripe (ou simulée) — sûre à exposer sur lien token. */
  paymentLinkUrl: string | null;
};

/**
 * Retourne uniquement les champs sûrs pour le portail public (lien token).
 * Aucun UID ni téléphone. Le montant facturé et l'URL de paiement Stripe
 * sont volontairement inclus pour permettre le règlement depuis le suivi.
 */
export function toPortalSummary(
  iv: Intervention,
  technicianDisplayName?: string | null
): PortalInterventionSummary {
  const invoiced =
    typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
      ? Math.round(iv.invoiceAmountCents)
      : null;
  return {
    id: iv.id,
    status: iv.status,
    statusUpdatedAt: iv.statusUpdatedAt ?? null,
    clientFirstName: iv.clientFirstName ?? null,
    clientLastName: iv.clientLastName ?? null,
    address: iv.address,
    scheduledDate: iv.scheduledDate ?? null,
    scheduledTime: iv.scheduledTime ?? null,
    assignedTechnicianName: technicianDisplayName ?? null,
    category: iv.category,
    problem: iv.problem ?? null,
    createdAt: iv.createdAt ?? null,
    paymentStatus: iv.paymentStatus ?? null,
    invoiceAmountCents: invoiced,
    paymentLinkUrl: iv.stripePaymentLinkUrl?.trim() || null,
  };
}
