import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
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

export function buildInterventionInvoiceEmailBody(params: {
  clientLabel: string;
  portalUrl?: string | null;
  paymentLinkUrl?: string | null;
}): string {
  const lines = [
    `Bonjour ${params.clientLabel},`,
    "",
    "Veuillez trouver ci-joint la facture relative à votre intervention.",
    "",
  ];
  if (params.portalUrl?.trim()) {
    lines.push(`Suivi en ligne : ${params.portalUrl.trim()}`, "");
  }
  if (params.paymentLinkUrl?.trim()) {
    lines.push(`Payer en ligne (carte bancaire) : ${params.paymentLinkUrl.trim()}`, "");
  }
  lines.push("Cordialement,", "MAP BELGIQUE");
  return lines.join("\n");
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
  const portalToken = params.iv.portalAccessToken?.trim();
  const portalUrl = portalToken ? buildPortalSuiviUrl(portalToken) : null;
  const paymentLinkUrl = params.iv.stripePaymentLinkUrl?.trim() || null;

  const subject = `Votre facture — intervention ${params.interventionId.slice(-8)}`;
  const bodyText = buildInterventionInvoiceEmailBody({
    clientLabel,
    portalUrl,
    paymentLinkUrl,
  });

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
