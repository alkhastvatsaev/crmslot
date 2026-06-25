import type * as admin from "firebase-admin";
import {
  buildDraftBillingPackage,
  type DraftBillingLine,
} from "@/features/interventions/draftInvoiceBilling";
import type { Intervention } from "@/features/interventions/types";
import { normalizeBillingSurchargeSettings } from "@/features/billing/billingSurchargeSettings";

export type PrepareDraftBillingResult = {
  billingLines: DraftBillingLine[];
  invoiceAmountCents: number;
  source: string;
  aiNote?: string;
};

export async function prepareDraftBillingOnIntervention(
  db: admin.firestore.Firestore,
  interventionId: string,
  opts?: { forceRegenerate?: boolean }
): Promise<PrepareDraftBillingResult> {
  const snap = await db.collection("interventions").doc(interventionId).get();
  if (!snap.exists) {
    throw new Error("Intervention introuvable.");
  }
  const iv = { id: snap.id, ...snap.data() } as Intervention;

  let surchargeSettings;
  const companyId = typeof iv.companyId === "string" ? iv.companyId.trim() : "";
  if (companyId) {
    const companySnap = await db.collection("companies").doc(companyId).get();
    if (companySnap.exists) {
      surchargeSettings = normalizeBillingSurchargeSettings(
        companySnap.data()?.billingSurchargeSettings
      );
    }
  }

  const pkg = await buildDraftBillingPackage(iv, { ...opts, surchargeSettings });
  await db
    .collection("interventions")
    .doc(interventionId)
    .update({
      billingLines: pkg.lines,
      invoiceAmountCents: pkg.invoiceAmountCents,
      draftBillingSource: pkg.source,
      draftBillingAiNote: pkg.aiNote ?? null,
      draftBillingPreparedAt: new Date().toISOString(),
    });

  return {
    billingLines: pkg.lines,
    invoiceAmountCents: pkg.invoiceAmountCents,
    source: pkg.source,
    aiNote: pkg.aiNote,
  };
}
