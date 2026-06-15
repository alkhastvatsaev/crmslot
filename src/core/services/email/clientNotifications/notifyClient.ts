import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";
import { logger } from "@/core/logger";
import {
  renderClientEmailLayout,
  renderClientEmailText,
} from "@/core/services/email/clientNotifications/clientEmailLayout";
import { resolveClientNotificationPrefs } from "@/core/services/email/clientNotifications/resolveClientNotificationPrefs";

export type NotifyClientInput = {
  interventionId: string;
  companyId: string;
  clientId?: string | null;
  fallbackEmail?: string | null;
  /** Identifiant logique du template (analytics / tests). */
  template: string;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  bodyHtml: string;
  /** Lignes pour la version texte (fallback Gmail / accessibility). */
  bodyLines: string[];
  ctaLabel?: string;
  ctaUrl?: string;
  sentByUid?: string;
};

export type NotifyClientResult =
  | { ok: true; messageId: string; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

export async function notifyClient(input: NotifyClientInput): Promise<NotifyClientResult> {
  const prefs = await resolveClientNotificationPrefs({
    companyId: input.companyId,
    clientId: input.clientId,
    fallbackEmail: input.fallbackEmail,
  });

  if (!prefs.shouldSend || !prefs.email) {
    logger.info("[notifyClient] skipped", {
      template: input.template,
      interventionId: input.interventionId,
      reason: prefs.reason ?? "no_email",
    });
    return { ok: true, skipped: true, reason: prefs.reason ?? "no_email" };
  }

  const bodyHtml = renderClientEmailLayout({
    preheader: input.preheader,
    heading: input.heading,
    intro: input.intro,
    bodyHtml: input.bodyHtml,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    unsubscribeToken: prefs.unsubscribeToken,
  });

  const bodyText = renderClientEmailText({
    heading: input.heading,
    intro: input.intro,
    bodyLines: input.bodyLines,
    ctaLabel: input.ctaLabel,
    ctaUrl: input.ctaUrl,
    unsubscribeToken: prefs.unsubscribeToken,
  });

  const result = await sendInterventionEmail({
    interventionId: input.interventionId,
    companyId: input.companyId,
    to: prefs.email,
    subject: input.subject,
    bodyText,
    bodyHtml,
    sentByUid: input.sentByUid ?? "system",
    sentVia: `client-notify:${input.template}`,
    attachDocumentType: "none",
  });

  if (!result.ok) {
    logger.warn("[notifyClient] send failed", {
      template: input.template,
      interventionId: input.interventionId,
      error: result.error,
    });
    return { ok: false, error: result.error };
  }

  return { ok: true, messageId: result.messageId };
}
