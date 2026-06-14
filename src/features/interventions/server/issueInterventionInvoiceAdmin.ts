import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { allocateInvoiceNumberAdmin } from "@/features/billing/server/allocateInvoiceNumberAdmin";
import { isValidInvoiceNumber } from "@/features/billing/invoiceNumbering";
import {
  totalCentsFromBillingLines,
  type DraftBillingLine,
} from "@/features/interventions/draftInvoiceBilling";
import { finalizeInterventionInvoiceAdmin } from "@/features/interventions/server/finalizeInterventionInvoiceAdmin";
import { prepareDraftBillingOnIntervention } from "@/features/interventions/server/prepareDraftBillingOnIntervention";
import { createInterventionPaymentLinkAdmin } from "@/features/billing/server/createInterventionPaymentLinkAdmin";
import { ensurePortalAccessTokenAdmin } from "@/features/interventions/server/ensurePortalAccessTokenAdmin";
import { sendInterventionInvoiceEmailToClient } from "@/features/interventions/server/interventionInvoiceEmail";
import type { Intervention } from "@/features/interventions/types";
import { transitionInterventionStatusAdmin } from "@/features/interventions/workflow/transitionInterventionStatusAdmin";
import {
  dispatcherTransitionActor,
  technicianTransitionActor,
} from "@/features/interventions/workflow/workflowActor";
import type { TransitionActor } from "@/features/interventions/workflow/interventionWorkflowTypes";

export type IssueInterventionInvoiceResult = {
  invoicePdfUrl: string;
  invoiceAmountCents: number;
  invoiceNumber: string;
  emailSent: boolean;
  emailError?: string;
};

export async function issueInterventionInvoiceAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  actorUid: string;
  sendEmail?: boolean;
  billingLinesOverride?: DraftBillingLine[];
  transitionNote?: string;
  /** Rôle pour la transition done → invoiced (technicien terrain ou dispatch). */
  actorRole?: TransitionActor["role"];
}): Promise<IssueInterventionInvoiceResult> {
  const { db, interventionId, actorUid } = params;
  const sendEmail = params.sendEmail !== false;

  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }
  let iv = { id: snap.id, ...snap.data() } as Intervention;

  if (iv.status !== "done") {
    throw new Error(`Facturation impossible : statut « ${iv.status} » (attendu : done).`);
  }

  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) {
    throw new Error("companyId manquant.");
  }

  if (params.billingLinesOverride && params.billingLinesOverride.length > 0) {
    const lines = params.billingLinesOverride;
    const invoiceAmountCents = totalCentsFromBillingLines(lines);
    await db.collection("interventions").doc(interventionId).update({
      billingLines: lines,
      invoiceAmountCents,
    });
    iv = { ...iv, billingLines: lines, invoiceAmountCents };
  }

  await prepareDraftBillingOnIntervention(db, interventionId);
  const refreshed = await db.collection("interventions").doc(interventionId).get();
  iv = { id: refreshed.id, ...refreshed.data() } as Intervention;

  const invoiceNumber = isValidInvoiceNumber(iv.invoiceNumber)
    ? iv.invoiceNumber.trim()
    : await allocateInvoiceNumberAdmin(db, companyId);
  iv = { ...iv, invoiceNumber };

  const invoicePatch = await finalizeInterventionInvoiceAdmin(iv, interventionId);
  const actor =
    params.actorRole === "technician"
      ? technicianTransitionActor(actorUid)
      : dispatcherTransitionActor(actorUid);

  await transitionInterventionStatusAdmin({
    db,
    interventionId,
    iv,
    toStatus: "invoiced",
    actor,
    note: params.transitionNote ?? "Facture émise",
    extraPatch: {
      invoicePdfUrl: invoicePatch.invoicePdfUrl,
      invoicePdfStoragePath: invoicePatch.invoicePdfStoragePath,
      invoiceAmountCents: invoicePatch.invoiceAmountCents,
      invoiceNumber,
      invoicedAt: FieldValue.serverTimestamp(),
      paymentStatus: iv.paymentStatus === "paid" ? "paid" : "unpaid",
    },
    writeInboxAlerts: false,
  });

  void import("@/features/integrations/server/dispatchCompanyWebhooksAdmin")
    .then(({ dispatchCompanyWebhooksAdmin }) =>
      dispatchCompanyWebhooksAdmin(companyId, "intervention.invoiced", {
        interventionId,
        at: new Date().toISOString(),
        data: {
          invoiceNumber,
          invoiceAmountCents: invoicePatch.invoiceAmountCents,
        },
      })
    )
    .catch(() => {});

  let ivAfter = {
    ...iv,
    ...invoicePatch,
    status: "invoiced" as const,
    paymentStatus: (iv.paymentStatus === "paid"
      ? "paid"
      : "unpaid") as Intervention["paymentStatus"],
  };

  const portalAccessToken = await ensurePortalAccessTokenAdmin(db, interventionId, ivAfter);
  ivAfter = { ...ivAfter, portalAccessToken };

  if (ivAfter.paymentStatus !== "paid") {
    try {
      const pay = await createInterventionPaymentLinkAdmin({
        db,
        interventionId,
        actorUid,
        iv: ivAfter,
      });
      if (pay.url) {
        ivAfter = {
          ...ivAfter,
          stripePaymentLinkUrl: pay.url,
          paymentStatus: pay.paymentStatus ?? "pending",
        };
      }
    } catch {
      // Paiement en ligne optionnel — la facture reste émise.
    }
  }

  let emailSent = false;
  let emailError: string | undefined;
  if (sendEmail) {
    const mail = await sendInterventionInvoiceEmailToClient({
      interventionId,
      iv: ivAfter,
      sentByUid: actorUid,
    });
    emailSent = mail.ok;
    if (!mail.ok && !mail.skipped) {
      emailError = mail.error;
    }
  }

  return {
    invoicePdfUrl: invoicePatch.invoicePdfUrl,
    invoiceAmountCents: invoicePatch.invoiceAmountCents,
    invoiceNumber,
    emailSent,
    emailError,
  };
}
