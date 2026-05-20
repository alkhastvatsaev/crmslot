import nodemailer from "nodemailer";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/core/config/firebase-admin";
import { isGmailOAuthConfigured } from "@/core/services/email/gmailOAuthConfig";
import { parseAttachDocumentType } from "@/core/services/email/interventionEmailAttachOptions";
import type { InterventionEmailPdfKind } from "@/core/services/email/interventionEmailPdfAttachment";
import { sendViaGmailApi } from "@/core/services/email/sendViaGmailApi";

const COLLECTION = "intervention_emails";

export type SendInterventionEmailInput = {
  interventionId: string;
  companyId: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  inReplyTo?: string;
  references?: string;
  sentByUid: string;
  sentVia?: string;
  /** quote | invoice = joint PDF généré par la PWA ; none = pas de pièce jointe */
  attachDocumentType?: InterventionEmailPdfKind | "none";
};

export type SendInterventionEmailResult =
  | { ok: true; messageId: string; attachmentFilename?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeRecipientEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidRecipientEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isGmailConfigured(): boolean {
  const hasSmtp = Boolean(process.env.GMAIL_USER?.trim() && process.env.GMAIL_APP_PASSWORD?.trim());
  return hasSmtp || isGmailOAuthConfigured();
}

/**
 * Envoi email dossier : Gmail API (OAuth) si configuré, sinon SMTP (mot de passe d'application).
 */
export async function sendInterventionEmail(
  input: SendInterventionEmailInput,
): Promise<SendInterventionEmailResult> {
  const interventionId = input.interventionId.trim();
  const companyId = input.companyId.trim();
  const to = normalizeRecipientEmail(input.to);
  const subject = input.subject.trim();
  const bodyText = input.bodyText.trim();

  if (!interventionId || !companyId || !to || !subject || !bodyText) {
    return { ok: false, error: "Champs requis : interventionId, companyId, to, subject, bodyText." };
  }
  if (!isValidRecipientEmail(to)) {
    return { ok: false, error: `Adresse destinataire invalide : ${to}` };
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!isGmailOAuthConfigured() && (!gmailUser || !gmailPass)) {
    return {
      ok: false,
      error:
        "Configuration Gmail manquante : GMAIL_USER + (GMAIL_APP_PASSWORD ou OAuth GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GMAIL_REFRESH_TOKEN).",
    };
  }

  const replyToDomain =
    process.env.REPLY_TO_DOMAIN?.trim() ?? gmailUser?.split("@")[1] ?? "mapbelgique.com";
  const fromName = process.env.EMAIL_FROM_NAME?.trim() || "MAP BELGIQUE";
  const messageId = `<${crypto.randomUUID()}@${replyToDomain}>`;
  const replyTo = `support+${interventionId}@${replyToDomain}`;

  const attachKind = parseAttachDocumentType(input.attachDocumentType ?? "invoice");
  let attachmentFilename: string | undefined;
  let pdfAttachment: { filename: string; content: Buffer; contentType: string } | undefined;

  if (attachKind !== "none") {
    try {
      const { buildInterventionEmailPdfAttachment } =
        await import("@/core/services/email/interventionEmailPdfAttachment");
      const att = await buildInterventionEmailPdfAttachment(interventionId, attachKind);
      pdfAttachment = att;
      attachmentFilename = att.filename;
    } catch (pdfErr) {
      const detail = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
      console.error("[sendInterventionEmail] PDF attachment failed:", pdfErr);
      return {
        ok: false,
        error: `Impossible de joindre le PDF ${attachKind === "quote" ? "devis" : "facture"} : ${detail}`,
      };
    }
    if (!pdfAttachment?.content?.length) {
      return {
        ok: false,
        error: `PDF ${attachKind === "quote" ? "devis" : "facture"} vide ou non généré pour ce dossier.`,
      };
    }
  }

  const bodyHtml = input.bodyHtml ?? `<p>${bodyText.replace(/\n/g, "<br>")}</p>`;

  try {
    if (isGmailOAuthConfigured()) {
      await sendViaGmailApi({
        to,
        subject,
        bodyText,
        bodyHtml,
        messageId,
        replyTo,
        inReplyTo: input.inReplyTo,
        references: input.references,
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
        headers: {
          "Message-ID": messageId,
          ...(input.inReplyTo ? { "In-Reply-To": input.inReplyTo } : {}),
          ...(input.references ? { References: input.references } : {}),
          "X-Intervention-ID": interventionId,
        },
        ...(pdfAttachment
          ? {
              attachments: [
                {
                  filename: pdfAttachment.filename,
                  content: pdfAttachment.content,
                  contentType: pdfAttachment.contentType,
                },
              ],
            }
          : {}),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Envoi échoué.";
    return { ok: false, error: msg };
  }

  try {
    const db = getAdminDb();
    await db.collection(COLLECTION).add({
      interventionId,
      companyId,
      direction: "outbound",
      from: gmailUser,
      to,
      subject,
      bodyText,
      ...(input.bodyHtml ? { bodyHtml: input.bodyHtml } : {}),
      messageId,
      ...(input.inReplyTo ? { inReplyTo: input.inReplyTo } : {}),
      ...(input.references ? { references: input.references } : {}),
      createdAt: FieldValue.serverTimestamp(),
      sentByUid: input.sentByUid,
      ...(input.sentVia ? { sentVia: input.sentVia } : {}),
      ...(attachmentFilename ? { attachmentFilename } : {}),
      readAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[sendInterventionEmail] Firestore write failed:", err);
  }

  return { ok: true, messageId, attachmentFilename };
}
