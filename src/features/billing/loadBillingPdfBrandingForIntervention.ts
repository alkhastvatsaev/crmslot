import type * as admin from "firebase-admin";
import {
  fetchBillingPdfBrandingForCompany,
  type BillingPdfBranding,
} from "@/features/billing/billingPdfBranding";

/** Charge le branding société pour les PDF facture/devis d'une intervention. */
export async function loadBillingPdfBrandingForIntervention(
  firestore: admin.firestore.Firestore,
  companyId: string,
): Promise<BillingPdfBranding> {
  const snap = await firestore.doc(`companies/${companyId}`).get();
  return fetchBillingPdfBrandingForCompany(
    snap.exists ? (snap.data() as Record<string, unknown>) : undefined,
    companyId,
  );
}
