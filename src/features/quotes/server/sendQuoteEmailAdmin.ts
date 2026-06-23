import crypto from "node:crypto";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
import {
  isGmailConfigured,
  isValidRecipientEmail,
  normalizeRecipientEmail,
} from "@/core/services/email/sendInterventionEmail";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { sendViaGmailApi } from "@/core/services/email/sendViaGmailApi";
import { loadBillingPdfBrandingForIntervention } from "@/features/billing/loadBillingPdfBrandingForIntervention";
import { buildQuotePdfFromQuote, quotePdfFileName } from "@/features/quotes/buildQuotePdfFromQuote";
import type { Quote } from "@/features/quotes/types";
import { ensurePortalAccessTokenAdmin } from "@/features/interventions/server/ensurePortalAccessTokenAdmin";
import type { Intervention } from "@/features/interventions";

export function buildQuoteEmailBody(params: {
  clientLabel: string;
  totalTtcEur: string;
  validityDays: number;
  portalUrl?: string | null;
}): string {
  const lines = [
    `Bonjour ${params.clientLabel},`,
    "",
    `Veuillez trouver ci-joint notre devis (${params.totalTtcEur} TTC, validité ${params.validityDays} jours).`,
    "",
  ];
  if (params.portalUrl?.trim()) {
    lines.push(`Suivez votre demande et validez en ligne : ${params.portalUrl.trim()}`, "");
  }
  lines.push(
    "Pour accepter ce devis, répondez à cet e-mail ou contactez-nous.",
    "",
    "Cordialement,",
    "MAP BELGIQUE"
  );
  return lines.join("\n");
}

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
  }).format(Math.max(0, cents) / 100);
}

export async function sendQuoteEmailAdmin(params: {
  db: admin.firestore.Firestore;
  companyId: string;
  quoteId: string;
  sentByUid: string;
}): Promise<{ ok: true; emailSent: true } | { ok: false; error: string; skipped?: boolean }> {
  const { db, companyId, quoteId } = params;

  const quoteSnap = await db
    .collection("companies")
    .doc(companyId)
    .collection("quotes")
    .doc(quoteId)
    .get();
  if (!quoteSnap.exists) {
    return { ok: false, error: "Devis introuvable." };
  }
  const quote = { id: quoteSnap.id, ...quoteSnap.data() } as Quote;

  const to = normalizeRecipientEmail(String(quote.clientEmail ?? "").trim());
  if (!to || !isValidRecipientEmail(to)) {
    return { ok: false, error: "E-mail client manquant ou invalide.", skipped: true };
  }
  if (!isGmailConfigured()) {
    return { ok: false, error: "Envoi e-mail non configuré (Gmail)." };
  }

  let portalUrl: string | null = null;
  const interventionId = quote.interventionId?.trim();
  if (interventionId) {
    const ivSnap = await db.collection("interventions").doc(interventionId).get();
    if (ivSnap.exists) {
      const iv = { id: ivSnap.id, ...ivSnap.data() } as Intervention;
      const token = await ensurePortalAccessTokenAdmin(db, interventionId, iv);
      portalUrl = buildPortalSuiviUrl(token);
    }
  }

  const branding = await loadBillingPdfBrandingForIntervention(db, companyId);
  const pdfBytes = buildQuotePdfFromQuote(quote, branding);
  const pdfAttachment = {
    filename: quotePdfFileName(quote),
    content: Buffer.from(pdfBytes),
    contentType: "application/pdf" as const,
  };

  const tva = Math.round(quote.totalCents * 0.06);
  const totalTtc = quote.totalCents + tva;
  const clientLabel = quote.clientName?.trim() || "Client";
  const subject = `Votre devis — ${quote.id.slice(-8).toUpperCase()}`;
  const bodyText = buildQuoteEmailBody({
    clientLabel,
    totalTtcEur: formatEur(totalTtc),
    validityDays: quote.validityDays,
    portalUrl,
  });
  const bodyHtml = `<p>${bodyText.replace(/\n/g, "<br>")}</p>`;

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();
  const oauthReady = await isGmailOAuthConfigured();
  const replyToDomain =
    process.env.REPLY_TO_DOMAIN?.trim() ?? gmailUser?.split("@")[1] ?? "mapbelgique.com";
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "MAP BELGIQUE";
  const messageId = `<${crypto.randomUUID()}@${replyToDomain}>`;
  const replyTo = `devis+${quoteId}@${replyToDomain}`;

  try {
    if (oauthReady) {
      await sendViaGmailApi({
        to,
        subject,
        bodyText,
        bodyHtml,
        messageId,
        replyTo,
        attachment: pdfAttachment,
      });
    } else {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser!, pass: gmailPass! },
      });
      await transporter.sendMail({
        from: `"${fromName}" <${gmailUser}>`,
        to,
        subject,
        text: bodyText,
        html: bodyHtml,
        replyTo,
        attachments: [
          {
            filename: pdfAttachment.filename,
            content: pdfAttachment.content,
            contentType: pdfAttachment.contentType,
          },
        ],
      });
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Envoi échoué." };
  }

  const now = new Date().toISOString();
  await quoteSnap.ref.update({
    status: "sent",
    sentAt: now,
    updatedAt: FieldValue.serverTimestamp(),
  });

  await db.collection("companies").doc(companyId).collection("quote_emails").add({
    quoteId,
    companyId,
    to,
    subject,
    sentByUid: params.sentByUid,
    sentAt: now,
    portalUrl,
  });

  return { ok: true, emailSent: true };
}
