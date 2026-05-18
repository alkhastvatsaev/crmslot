import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
  buildInterventionInvoicePdfBuffer,
  firebaseDownloadUrl,
  newDownloadToken,
} from "./buildInterventionInvoicePdf";
import { runCommissionOnInvoiced } from "./commissionAutomation";

function completionPhotoUrls(data: admin.firestore.DocumentData): string[] {
  const structured = Array.isArray(data.completionPhotos)
    ? (data.completionPhotos as { url?: string }[])
        .map((p) => (typeof p?.url === "string" ? p.url.trim() : ""))
        .filter((u) => u.length > 0)
    : [];
  if (structured.length > 0) return structured;
  const legacy = Array.isArray(data.completionPhotoUrls) ? data.completionPhotoUrls : [];
  return legacy.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
}

function checklistComplete(data: admin.firestore.DocumentData | undefined): boolean {
  if (!data) return false;
  const photos = completionPhotoUrls(data);
  const sig = data.completionSignatureUrl;
  return photos.length > 0 && typeof sig === "string" && sig.trim().length > 0;
}

/** Déclenché à chaque écriture ; idempotent si déjà facturé ou checklist incomplète. */
export async function runAutoInvoiceGeneration(event: {
  params: { interventionId: string };
  data?: {
    before?: admin.firestore.DocumentSnapshot | undefined;
    after?: admin.firestore.DocumentSnapshot | undefined;
  };
}): Promise<void> {
  const interventionId = event.params.interventionId;
  const afterSnap = event.data?.after;
  if (!afterSnap?.exists) return;

  const after = afterSnap.data();
  if (!after) return;

  if (after.status === "invoiced") return;
  if (typeof after.invoicePdfUrl === "string" && after.invoicePdfUrl.length > 0) return;
  if (after.status !== "done") return;
  if (!checklistComplete(after)) return;

  const db = admin.firestore();
  const ref = db.collection("interventions").doc(interventionId);

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
    billingLines: Array.isArray(after.billingLines) ? after.billingLines : [],
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
    status: "invoiced",
    invoicedAt: FieldValue.serverTimestamp(),
    invoiceAmountCents,
    paymentStatus: after.paymentStatus === "paid" ? "paid" : "unpaid",
  });

  const invoicedSnap = await ref.get();
  const invoicedData = invoicedSnap.data();
  if (invoicedData) {
    await runCommissionOnInvoiced(interventionId, invoicedData);
  }

  logger.info("Auto invoice generated", { interventionId, objectPath });
}
