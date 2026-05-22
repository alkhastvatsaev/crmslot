import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/core/config/firebase";
import type { ChatbotClientDocumentAction } from "@/features/chatbot/chatbot-client-document";
import type { Intervention } from "@/features/interventions/types";
import { logCrmInterventionAction } from "./logCrmInterventionAction";

function isBillingDocumentAction(
  action: ChatbotClientDocumentAction,
): action is Extract<
  ChatbotClientDocumentAction,
  { action: "patch" | "append_billing" }
> & { interventionId: string } {
  return action.action === "patch" || action.action === "append_billing";
}

function billingActionNote(action: ChatbotClientDocumentAction): string {
  const isInvoice =
    "previewDocumentType" in action && action.previewDocumentType !== "quote";
  const label = isInvoice ? "Facture" : "Devis";
  if (action.action === "append_billing") return `${label} — lignes ajoutées`;
  if (action.action === "patch") return `${label} — ligne modifiée`;
  return label;
}

/** Journal CRM côté client après sauvegarde facturation chatbot (filet si le log serveur a raté). */
export async function logCrmAfterDocumentBilling(
  action: ChatbotClientDocumentAction,
  companyId: string,
): Promise<void> {
  if (!isBillingDocumentAction(action) || !firestore) return;

  const interventionId = action.interventionId.trim();
  if (!interventionId) return;

  const snap = await getDoc(doc(firestore, "interventions", interventionId));
  if (!snap.exists()) return;

  const iv = { id: snap.id, ...snap.data() } as Intervention;
  if ((iv.companyId ?? "").trim() !== companyId.trim()) return;

  const actorUid = auth?.currentUser?.uid?.trim() || "system";
  const lines = Array.isArray(iv.billingLines) ? iv.billingLines.length : 0;
  const totalCents =
    typeof iv.invoiceAmountCents === "number"
      ? iv.invoiceAmountCents
      : Array.isArray(iv.billingLines)
        ? iv.billingLines.reduce(
            (s, l) => s + Math.round((l.unitPriceCents ?? 0) * (l.quantity ?? 1)),
            0,
          )
        : 0;

  await logCrmInterventionAction({
    kind: "intervention_billing_updated",
    iv,
    actorUid,
    actorRole: "dispatcher",
    note: `${billingActionNote(action)} · ${lines} ligne(s) · ${Math.round(totalCents) / 100} €`,
  });
}
