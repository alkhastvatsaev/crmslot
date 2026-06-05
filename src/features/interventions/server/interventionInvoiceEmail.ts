import {
  isGmailConfigured,
  isValidRecipientEmail,
  normalizeRecipientEmail,
  sendInterventionEmail,
} from "@/core/services/email/sendInterventionEmail";
import type { Intervention } from "@/features/interventions/types";

export function interventionClientRecipient(iv: Intervention): string | null {
  const email = normalizeRecipientEmail(String(iv.clientEmail ?? "").trim());
  if (!email || !isValidRecipientEmail(email)) return null;
  return email;
}

export async function sendInterventionInvoiceEmailToClient(params: {
  interventionId: string;
  iv: Intervention;
  sentByUid: string;
}): Promise<{ ok: true } | { ok: false; error: string; skipped?: boolean }> {
  const to = interventionClientRecipient(params.iv);
  if (!to) {
    return { ok: false, error: "Aucun e-mail client valide sur le dossier.", skipped: true };
  }
  if (!isGmailConfigured()) {
    return { ok: false, error: "Envoi e-mail non configuré (Gmail)." };
  }

  const companyId = String(params.iv.companyId ?? "").trim();
  if (!companyId) {
    return { ok: false, error: "companyId manquant." };
  }

  const clientLabel =
    (typeof params.iv.clientName === "string" && params.iv.clientName.trim()) || "Client";
  const subject = `Votre facture — intervention ${params.interventionId.slice(-8)}`;
  const bodyText = [
    `Bonjour ${clientLabel},`,
    "",
    "Veuillez trouver ci-joint la facture relative à votre intervention.",
    "",
    "Cordialement,",
    "MAP BELGIQUE",
  ].join("\n");

  const result = await sendInterventionEmail({
    interventionId: params.interventionId,
    companyId,
    to,
    subject,
    bodyText,
    sentByUid: params.sentByUid,
    attachDocumentType: "invoice",
  });

  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
