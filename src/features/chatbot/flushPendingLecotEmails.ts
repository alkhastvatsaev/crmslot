import * as admin from "firebase-admin";
import "@/core/config/firebase-admin";
import { sendLecotOrderEmail } from "@/features/chatbot/sendLecotOrderEmail";
import { logger } from "@/core/logger";
import type { SupplierOrderLine } from "@/features/suppliers";

/**
 * Envoie les bons de commande Lecot dont l'email était en attente (Gmail déconnecté).
 * Appelé après reconnexion Gmail — itère sur toutes les sociétés.
 */
export async function flushPendingLecotEmails(): Promise<{ flushed: number; failed: number }> {
  if (!admin.apps.length) return { flushed: 0, failed: 0 };

  const firestore = admin.firestore();
  const companiesSnap = await firestore.collection("companies").get();

  let flushed = 0;
  let failed = 0;

  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id;
    const pendingSnap = await firestore
      .collection("companies")
      .doc(companyId)
      .collection("supplierOrders")
      .where("emailPending", "==", true)
      .get();

    for (const orderDoc of pendingSnap.docs) {
      const data = orderDoc.data();
      try {
        const result = await sendLecotOrderEmail({
          orderId: orderDoc.id,
          companyId,
          lines: (data.lines ?? []) as SupplierOrderLine[],
          totalCents: Number(data.totalCents ?? 0),
          clientName: (data.clientName ?? data.nom ?? null) as string | null,
          notes: (data.notes ?? null) as string | null,
          reference: (data.reference ?? null) as string | null,
        });

        if (result.ok) {
          await orderDoc.ref.update({
            emailPending: false,
            emailSentAt: new Date().toISOString(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          flushed++;
        } else {
          failed++;
        }
      } catch (err) {
        logger.error("[flush-lecot-emails]", { orderId: orderDoc.id, error: err });
        failed++;
      }
    }
  }

  return { flushed, failed };
}
