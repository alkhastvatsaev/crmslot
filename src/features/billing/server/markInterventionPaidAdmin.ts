import "@/core/config/firebase-admin";
import { getAdminDb } from "@/core/config/firebase-admin";
import { notifyClientPaymentReceived } from "@/core/services/notifications/clientPaymentPush";
import { notifyClient } from "@/core/services/email/clientNotifications/notifyClient";
import { buildClientPaymentReceivedEmail } from "@/core/services/email/clientNotifications/clientExtraTemplates";
import { logCrmInterventionActionAdmin } from "@/features/crmHistory/logCrmInterventionActionAdmin";
import { notifyCompanyAdminsPush } from "@/features/notifications/notifyCompanyAdminsPush";
import type { Intervention } from "@/features/interventions";

function formatAmount(amount: unknown, currency: unknown): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "";
  const cur = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "";
  const formatted = amount.toFixed(2).replace(".", ",");
  return cur ? `${formatted} ${cur}` : formatted;
}

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
    const payload = buildClientPaymentReceivedEmail({
      interventionId,
      iv: {
        clientFirstName: typeof data.clientFirstName === "string" ? data.clientFirstName : null,
        title: typeof data.title === "string" ? data.title : null,
        problem: typeof data.problem === "string" ? data.problem : null,
        portalAccessToken:
          typeof data.portalAccessToken === "string" ? data.portalAccessToken : null,
      },
      amount: typeof data.invoiceAmount === "number" ? data.invoiceAmount : null,
      currency: typeof data.invoiceCurrency === "string" ? data.invoiceCurrency : null,
    });
    await notifyClient({
      interventionId,
      companyId,
      clientId: typeof data.clientId === "string" ? data.clientId : null,
      fallbackEmail: typeof data.clientEmail === "string" ? data.clientEmail : null,
      sentByUid: createdByUid ?? "system",
      ...payload,
    }).catch(() => {});
  }

  if (companyId) {
    // Push aux admins de la société (cash in — action comptable + suivi).
    const amountLabel = formatAmount(data.invoiceAmount, data.invoiceCurrency);
    const title = typeof data.title === "string" ? data.title : "Dossier";
    void notifyCompanyAdminsPush({
      companyId,
      title: "Paiement reçu",
      body: amountLabel ? `${title} — ${amountLabel}` : `${title} — facture payée`,
      data: {
        type: "payment_received",
        bmInterventionId: interventionId,
      },
    }).catch(() => {});

    void import("@/features/integrations/server/dispatchCompanyWebhooksAdmin")
      .then(({ dispatchCompanyWebhooksAdmin }) =>
        dispatchCompanyWebhooksAdmin(companyId, "intervention.payment_received", {
          interventionId,
          at: paidAt,
          data: { paymentIntentId: paymentIntentId ?? null },
        })
      )
      .catch(() => {});

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
