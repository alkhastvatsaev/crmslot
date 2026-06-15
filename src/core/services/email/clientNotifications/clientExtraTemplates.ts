import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
import type { Intervention } from "@/features/interventions/types";
import type { NotifyClientInput } from "@/core/services/email/clientNotifications/notifyClient";

type ExtraTemplatePayload = Omit<
  NotifyClientInput,
  "interventionId" | "companyId" | "clientId" | "fallbackEmail" | "sentByUid"
>;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hello(iv: Pick<Intervention, "clientFirstName">): string {
  const first = iv.clientFirstName?.trim();
  return first ? `Bonjour ${first},` : "Bonjour,";
}

function ctaPortal(
  iv: Pick<Intervention, "portalAccessToken">,
  label = "Suivre mon dossier"
): { ctaLabel: string; ctaUrl?: string } {
  const token = iv.portalAccessToken?.trim();
  return { ctaLabel: label, ctaUrl: token ? buildPortalSuiviUrl(token) : undefined };
}

function safeTitle(iv: { title?: string | null; problem?: string | null }): string {
  return (iv.title || iv.problem || "votre intervention").trim();
}

export function buildClientPaymentReceivedEmail(opts: {
  interventionId: string;
  iv: {
    clientFirstName?: string | null;
    title?: string | null;
    problem?: string | null;
    portalAccessToken?: string | null;
  };
  amount?: number | null;
  currency?: string | null;
}): ExtraTemplatePayload {
  const title = safeTitle(opts.iv);
  const amountLabel =
    typeof opts.amount === "number" && Number.isFinite(opts.amount)
      ? `${opts.amount.toFixed(2)} ${opts.currency?.trim() || "EUR"}`
      : null;
  const cta = ctaPortal(opts.iv, "Voir mon dossier");

  return {
    template: "client.payment.received",
    subject: `Paiement reçu — ${title}`,
    preheader: "Merci, votre paiement a bien été enregistré.",
    heading: "Merci, votre paiement est bien reçu",
    intro: `${hello(opts.iv)} Nous confirmons la bonne réception de votre paiement pour « ${title} ».`,
    bodyHtml: `
      ${amountLabel ? `<p style="margin:0 0 8px"><strong>Montant :</strong> ${escapeHtml(amountLabel)}</p>` : ""}
      <p style="margin:0">Votre dossier est désormais clos côté facturation. Vous pouvez retrouver le justificatif dans votre espace client.</p>
      <p style="margin:12px 0 0;color:#aab">Référence : ${escapeHtml(opts.interventionId)}</p>
    `,
    bodyLines: [
      `Paiement reçu pour « ${title} ».`,
      amountLabel ? `Montant : ${amountLabel}` : "",
      `Référence : ${opts.interventionId}`,
    ].filter(Boolean),
    ...cta,
  };
}

export function buildClientAppointmentReminderEmail(opts: {
  interventionId: string;
  iv: {
    clientFirstName?: string | null;
    title?: string | null;
    problem?: string | null;
    address?: string | null;
    portalAccessToken?: string | null;
  };
  whenLabel: string;
  reminderType: "24h" | "2h" | "30min" | string;
}): ExtraTemplatePayload {
  const title = safeTitle(opts.iv);
  const cta = ctaPortal(opts.iv);
  const horizon =
    opts.reminderType === "24h"
      ? "demain"
      : opts.reminderType === "2h"
        ? "dans environ 2h"
        : opts.reminderType === "30min"
          ? "dans environ 30 min"
          : "bientôt";

  return {
    template: `client.appointment.reminder.${opts.reminderType}`,
    subject: `Rappel rendez-vous — ${title}`,
    preheader: `Votre rendez-vous CRMSLOT ${horizon}.`,
    heading: `Votre rendez-vous est ${horizon}`,
    intro: `${hello(opts.iv)} Petit rappel pour votre rendez-vous concernant « ${title} ».`,
    bodyHtml: `
      <p style="margin:0 0 4px"><strong>Quand :</strong> ${escapeHtml(opts.whenLabel)}</p>
      ${opts.iv.address ? `<p style="margin:0"><strong>Adresse :</strong> ${escapeHtml(opts.iv.address)}</p>` : ""}
      <p style="margin:12px 0 0">Merci de préparer un accès libre au site. Si quelque chose change de votre côté, répondez simplement à cet email — nous nous adapterons.</p>
      <p style="margin:12px 0 0;color:#aab">Référence : ${escapeHtml(opts.interventionId)}</p>
    `,
    bodyLines: [
      `Rendez-vous : ${opts.whenLabel}`,
      opts.iv.address ? `Adresse : ${opts.iv.address}` : "",
      `Référence : ${opts.interventionId}`,
    ].filter(Boolean),
    ...cta,
  };
}

export function buildClientInterventionCreatedEmail(opts: {
  interventionId: string;
  iv: {
    clientFirstName?: string | null;
    title?: string | null;
    problem?: string | null;
    portalAccessToken?: string | null;
  };
}): ExtraTemplatePayload {
  const title = safeTitle(opts.iv);
  const cta = ctaPortal(opts.iv);

  return {
    template: "client.intervention.created",
    subject: `Demande bien reçue — ${title}`,
    preheader: "Votre demande est enregistrée, nous nous en occupons.",
    heading: "Votre demande est bien reçue",
    intro: `${hello(opts.iv)} Merci, votre demande « ${title} » est enregistrée dans notre système.`,
    bodyHtml: `
      <p style="margin:0 0 8px">Notre équipe analyse votre dossier et va l'attribuer à un technicien rapidement. Vous recevrez un email dès qu'un technicien sera désigné.</p>
      <p style="margin:8px 0 0">Pour toute information complémentaire, répondez simplement à cet email.</p>
      <p style="margin:12px 0 0;color:#aab">Référence : ${escapeHtml(opts.interventionId)}</p>
    `,
    bodyLines: [
      `Votre demande « ${title} » est bien enregistrée.`,
      "Nous vous tenons informé dès qu'un technicien est désigné.",
      `Référence : ${opts.interventionId}`,
    ],
    ...cta,
  };
}
