import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Intervention } from "@/features/interventions/types";
import {
  totalCentsFromBillingLines,
  type DraftBillingLine,
} from "@/features/interventions/draftInvoiceBilling";
import {
  buildInterventionInvoicePdfBuffer,
  firebaseDownloadUrl,
  newDownloadToken,
} from "@/features/interventions/server/buildInterventionInvoicePdf";

export type FinalizeInvoiceAdminResult = {
  invoicePdfUrl: string;
  invoicePdfStoragePath: string;
  invoiceAmountCents: number;
};

/** Génère le PDF facture sur Storage (sans changer le statut). */
export async function finalizeInterventionInvoiceAdmin(
  iv: Intervention,
  interventionId: string
): Promise<FinalizeInvoiceAdminResult> {
  const lines = (Array.isArray(iv.billingLines) ? iv.billingLines : []) as DraftBillingLine[];
  const invoiceAmountCents =
    typeof iv.invoiceAmountCents === "number" && iv.invoiceAmountCents > 0
      ? Math.round(iv.invoiceAmountCents)
      : totalCentsFromBillingLines(lines) || 15_000;

  const pdfBuffer = buildInterventionInvoicePdfBuffer({
    id: interventionId,
    title: iv.title ?? "",
    address: iv.address ?? "",
    clientName: iv.clientName ?? null,
    problem: iv.problem ?? null,
    invoiceAmountCents,
    invoiceNumber: iv.invoiceNumber ?? null,
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
      metadata: { firebaseStorageDownloadTokens: token },
      cacheControl: "public, max-age=31536000",
    },
  });

  const invoicePdfUrl = firebaseDownloadUrl(bucket.name, objectPath, token);

  return {
    invoicePdfUrl,
    invoicePdfStoragePath: objectPath,
    invoiceAmountCents,
  };
}

export async function patchInvoicedFieldsAdmin(
  db: admin.firestore.Firestore,
  interventionId: string,
  patch: FinalizeInvoiceAdminResult,
  paymentStatus?: Intervention["paymentStatus"]
): Promise<void> {
  await db
    .collection("interventions")
    .doc(interventionId)
    .update({
      invoicePdfUrl: patch.invoicePdfUrl,
      invoicePdfStoragePath: patch.invoicePdfStoragePath,
      invoiceAmountCents: patch.invoiceAmountCents,
      invoicedAt: FieldValue.serverTimestamp(),
      paymentStatus: paymentStatus === "paid" ? "paid" : "unpaid",
    });
}
