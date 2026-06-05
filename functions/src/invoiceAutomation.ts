import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildInterventionInvoicePdfBuffer,
  firebaseDownloadUrl,
  newDownloadToken,
} from "./buildInterventionInvoicePdf";
import { runCommissionOnInvoiced } from "./commissionAutomation";
import { logCompanyCrmActivityAdmin } from "./logCompanyCrmActivity";

/**
 * Génère le PDF uniquement quand IVANA valide (done → invoiced) et qu’aucun PDF n’existe encore.
 * Plus de passage automatique done → invoiced à la clôture terrain.
 */
export async function runAutoInvoiceGeneration(event: {
  params: { interventionId: string };
  data?: {
    before?: admin.firestore.DocumentSnapshot | undefined;
    after?: admin.firestore.DocumentSnapshot | undefined;
  };
}): Promise<void> {
  const interventionId = event.params.interventionId;
  const beforeSnap = event.data?.before;
  const afterSnap = event.data?.after;
  if (!afterSnap?.exists) return;

  const before = beforeSnap?.data();
  const after = afterSnap.data();
  if (!after) return;

  if (after.status !== "invoiced") return;
  if (before?.status !== "done") return;
  if (typeof after.invoicePdfUrl === "string" && after.invoicePdfUrl.length > 0) return;

  const db = admin.firestore();
  const ref = db.collection("interventions").doc(interventionId);

  const lines = Array.isArray(after.billingLines) ? after.billingLines : [];
  const invoiceAmountCents =
    typeof after.invoiceAmountCents === "number" && after.invoiceAmountCents > 0
      ? Math.round(after.invoiceAmountCents)
      : 15_000;

  const pdfBuffer = buildInterventionInvoicePdfBuffer({
    id: interventionId,
    title: typeof after.title === "string" ? after.title : "",
    address: typeof after.address === "string" ? after.address : "",
    clientName: after.clientName ?? null,
    problem: typeof after.problem === "string" ? after.problem : null,
    invoiceAmountCents,
    billingLines: lines,
  });

  const bucket = admin.storage().bucket();
  const objectPath = `invoices/${interventionId}.pdf`;
  const token = newDownloadToken();
  const file = bucket.file(objectPath);

  await file.save(pdfBuffer, {
    contentType: "application/pdf",
    resumable: false,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
      cacheControl: "public, max-age=31536000",
    },
  });

  const invoicePdfUrl = firebaseDownloadUrl(bucket.name, objectPath, token);

  await ref.update({
    invoicePdfUrl,
    invoicePdfStoragePath: objectPath,
    invoiceAmountCents,
    invoicedAt: FieldValue.serverTimestamp(),
    paymentStatus: after.paymentStatus === "paid" ? "paid" : "unpaid",
  });

  const invoicedSnap = await ref.get();
  const invoicedData = invoicedSnap.data();
  if (invoicedData) {
    await runCommissionOnInvoiced(interventionId, invoicedData);
  }

  const companyId =
    typeof after.companyId === "string" && after.companyId.trim()
      ? after.companyId.trim()
      : typeof invoicedData?.companyId === "string"
        ? invoicedData.companyId.trim()
        : "";
  if (companyId) {
    const title = typeof after.title === "string" ? after.title : "Dossier";
    const clientName =
      typeof after.clientName === "string"
        ? after.clientName
        : [after.clientFirstName, after.clientLastName].filter(Boolean).join(" ").trim() || null;
    await logCompanyCrmActivityAdmin(companyId, {
      kind: "intervention_invoiced",
      at: new Date().toISOString(),
      actorUid: "system",
      actorRole: "system",
      interventionId,
      interventionTitle: title,
      clientName,
      address: typeof after.address === "string" ? after.address : null,
      statusBefore: "done",
      statusAfter: "invoiced",
      note: `Facture PDF générée (${Math.round(invoiceAmountCents) / 100} €)`,
    }).catch((e) => logger.warn("CRM log invoice failed", e));
  }

  logger.info("Invoice PDF generated after validation", { interventionId, objectPath });
}
