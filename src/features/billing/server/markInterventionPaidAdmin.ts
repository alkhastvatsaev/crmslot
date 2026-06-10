import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { notifyClientPaymentReceived } from "@/core/services/notifications/clientPaymentPush";
import { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
import type { Intervention } from "@/features/interventions/types";

/**
 * Marque une intervention payée : statut paiement, timeline client,
 * push au demandeur et trace CRM. Utilisé par le webhook Stripe réel
 * et par le paiement simulé (mode mock sans clé Stripe).
 */
export async function markInterventionPaidAdmin(
  interventionId: string,
  paymentIntentId?: string,
  note = "Paiement Stripe reçu"
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("interventions").doc(interventionId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data() ?? {};
  const paidAt = new Date().toISOString();

  await ref.update({
    paymentStatus: "paid",
    paidAt,
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
  });

  const companyId =
    typeof data.companyId === "string" && data.companyId.length > 0 ? data.companyId : null;

  await ref.collection("timeline_events").add({
    interventionId,
    type: "comment",
    content: "Paiement enregistré",
    visibility: "client",
    createdAt: paidAt,
    createdByUid: "system",
    companyId,
  });

  const createdByUid = typeof data.createdByUid === "string" ? data.createdByUid : null;
  await notifyClientPaymentReceived(interventionId, createdByUid).catch(() => {});

  if (companyId) {
    await logCrmInterventionActionAdmin({
      kind: "intervention_payment_updated",
      iv: {
        id: interventionId,
        title: typeof data.title === "string" ? data.title : "Dossier",
        address: typeof data.address === "string" ? data.address : "",
        status: (data.status as Intervention["status"]) ?? "invoiced",
        companyId,
        clientName: typeof data.clientName === "string" ? data.clientName : undefined,
        clientFirstName: typeof data.clientFirstName === "string" ? data.clientFirstName : null,
        clientLastName: typeof data.clientLastName === "string" ? data.clientLastName : null,
        clientCompanyName:
          typeof data.clientCompanyName === "string" ? data.clientCompanyName : null,
      },
      actorUid: "stripe",
      actorRole: "system",
      note,
      statusAfter: "invoiced",
    });
  }
}
