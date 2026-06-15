import type { Intervention } from "@/features/interventions/types";
import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
import type { NotifyClientInput } from "@/core/services/email/clientNotifications/notifyClient";

type TemplateContext = {
  interventionId: string;
  iv: Intervention;
  fromStatus: Intervention["status"];
  toStatus: Intervention["status"];
};

type TemplateBuilder = (ctx: TemplateContext) => {
  template: string;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  bodyHtml: string;
  bodyLines: string[];
  ctaLabel?: string;
  ctaUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hello(iv: Intervention): string {
  const first = iv.clientFirstName?.trim();
  return first ? `Bonjour ${first},` : "Bonjour,";
}

function helloLine(iv: Intervention): string {
  return hello(iv);
}

function subjectTitle(iv: Intervention): string {
  return (iv.title || iv.problem || "votre intervention").trim();
}

function ctaPortal(iv: Intervention): { ctaLabel: string; ctaUrl?: string } | undefined {
  const token = iv.portalAccessToken?.trim();
  if (!token) return undefined;
  return { ctaLabel: "Suivre mon dossier", ctaUrl: buildPortalSuiviUrl(token) };
}

function technicianName(iv: Intervention): string | null {
  const fromField = (iv as { assignedTechnicianDisplayName?: string | null })
    .assignedTechnicianDisplayName;
  if (fromField && fromField.trim()) return fromField.trim();
  return null;
}

function scheduledLabel(iv: Intervention): string | null {
  const date = iv.scheduledDate?.trim();
  if (!date) return null;
  const time = iv.scheduledTime?.trim();
  return time ? `${date} à ${time}` : date;
}

const assignedTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const tech = technicianName(iv);
  const when = scheduledLabel(iv);

  const detailLines: string[] = [];
  if (tech) detailLines.push(`Technicien désigné : ${tech}`);
  if (when) detailLines.push(`Planifié : ${when}`);

  const detailsHtml = detailLines.length
    ? `<ul style="padding-left:18px;margin:8px 0">${detailLines
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join("")}</ul>`
    : "";

  const cta = ctaPortal(iv);

  return {
    template: "client.intervention.assigned",
    subject: `Votre dossier est pris en charge — ${title}`,
    preheader: "Un technicien est assigné à votre intervention.",
    heading: "Votre dossier est pris en charge",
    intro: `${greeting} Bonne nouvelle : nous avons assigné un technicien à votre dossier « ${title} ».`,
    bodyHtml: `
      <p style="margin:0 0 8px">Nous vous tiendrons informé à chaque étape (départ, arrivée, fin d'intervention).</p>
      ${detailsHtml}
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `Bonne nouvelle : nous avons assigné un technicien à votre dossier « ${title} ».`,
      ...detailLines,
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const enRouteTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const tech = technicianName(iv);
  const cta = ctaPortal(iv);

  return {
    template: "client.intervention.en_route",
    subject: `Technicien en route — ${title}`,
    preheader: "Votre technicien arrive bientôt.",
    heading: "Votre technicien est en route",
    intro: `${greeting} Votre technicien${tech ? ` ${tech}` : ""} vient de partir vers votre adresse pour « ${title} ».`,
    bodyHtml: `
      <p style="margin:0 0 8px">Il vous contactera si nécessaire à son arrivée. Merci de préparer un accès libre au site d'intervention.</p>
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `Votre technicien${tech ? ` ${tech}` : ""} vient de partir vers votre adresse pour « ${title} ».`,
      "Il vous contactera si nécessaire à son arrivée.",
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const onSiteTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const tech = technicianName(iv);
  const cta = ctaPortal(iv);

  return {
    template: "client.intervention.in_progress",
    subject: `Technicien sur place — ${title}`,
    preheader: "Le technicien est arrivé sur le site d'intervention.",
    heading: "Le technicien est sur place",
    intro: `${greeting}${tech ? ` ${tech}` : " Votre technicien"} vient d'arriver pour traiter « ${title} ».`,
    bodyHtml: `
      <p style="margin:0 0 8px">L'intervention est en cours. Vous recevrez un récapitulatif dès qu'elle sera terminée.</p>
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `${tech ?? "Votre technicien"} vient d'arriver pour traiter « ${title} ».`,
      "Vous recevrez un récapitulatif dès la fin.",
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const completedTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const cta = ctaPortal(iv);
  const photos = Array.isArray(iv.completionPhotos)
    ? iv.completionPhotos.length
    : Array.isArray(iv.completionPhotoUrls)
      ? iv.completionPhotoUrls.length
      : 0;

  return {
    template: "client.intervention.completed",
    subject: `Intervention terminée — ${title}`,
    preheader: "Récapitulatif de votre intervention.",
    heading: "Votre intervention est terminée",
    intro: `${greeting} L'intervention « ${title} » vient d'être finalisée par notre équipe.`,
    bodyHtml: `
      <p style="margin:0 0 8px">Vous pouvez retrouver le compte-rendu détaillé${
        photos ? `, les ${photos} photo${photos > 1 ? "s" : ""} de chantier` : ""
      } et la suite de votre dossier dans votre espace client.</p>
      <p style="margin:8px 0 0">Si quelque chose vous semble incomplet ou incorrect, répondez simplement à cet email — nous y répondons rapidement.</p>
      <p style="margin:12px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `L'intervention « ${title} » vient d'être finalisée.`,
      photos
        ? `${photos} photo${photos > 1 ? "s" : ""} ajoutée${photos > 1 ? "s" : ""} au dossier.`
        : "Compte-rendu disponible dans votre espace client.",
      "Pour toute question, répondez à cet email.",
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const invoicedTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const cta = ctaPortal(iv);

  return {
    template: "client.intervention.invoiced",
    subject: `Facture disponible — ${title}`,
    preheader: "Votre facture est prête.",
    heading: "Votre facture est disponible",
    intro: `${greeting} La facture relative à « ${title} » est maintenant disponible dans votre espace client.`,
    bodyHtml: `
      <p style="margin:0 0 8px">Vous pouvez la télécharger et procéder au paiement directement depuis le portail.</p>
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `La facture relative à « ${title} » est disponible.`,
      "Téléchargement et paiement sur votre portail client.",
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const cancelledTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);

  return {
    template: "client.intervention.cancelled",
    subject: `Annulation — ${title}`,
    preheader: "Votre intervention a été annulée.",
    heading: "Votre intervention a été annulée",
    intro: `${greeting} Votre dossier « ${title} » a été annulé.`,
    bodyHtml: `
      <p style="margin:0 0 8px">Si cette annulation est inattendue, contactez-nous en répondant simplement à cet email — nous reverrons votre dossier ensemble.</p>
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `Votre dossier « ${title} » a été annulé.`,
      "Si c'est inattendu, répondez à cet email pour échanger avec nous.",
      `Référence : ${interventionId}`,
    ],
  };
};

const waitingMaterialTemplate: TemplateBuilder = ({ interventionId, iv }) => {
  const greeting = helloLine(iv);
  const title = subjectTitle(iv);
  const cta = ctaPortal(iv);

  return {
    template: "client.intervention.waiting_material",
    subject: `Mise en attente — ${title}`,
    preheader: "Votre intervention est mise en pause le temps de recevoir une pièce.",
    heading: "Intervention en attente de matériel",
    intro: `${greeting} Pour finaliser « ${title} » nous avons besoin d'une pièce supplémentaire.`,
    bodyHtml: `
      <p style="margin:0 0 8px">Nous l'avons commandée auprès de notre fournisseur. Dès réception, votre technicien reprendra l'intervention et nous vous tiendrons informé.</p>
      <p style="margin:8px 0 0;color:#aab">Référence : ${escapeHtml(interventionId)}</p>
    `,
    bodyLines: [
      `Pour finaliser « ${title} » nous avons besoin d'une pièce supplémentaire.`,
      "Dès réception, l'intervention reprendra et nous vous tiendrons informé.",
      `Référence : ${interventionId}`,
    ],
    ...cta,
  };
};

const STATUS_TEMPLATES: Partial<Record<Intervention["status"], TemplateBuilder>> = {
  assigned: assignedTemplate,
  en_route: enRouteTemplate,
  in_progress: onSiteTemplate,
  waiting_material: waitingMaterialTemplate,
  done: completedTemplate,
  invoiced: invoicedTemplate,
  cancelled: cancelledTemplate,
};

/**
 * Retourne le payload prêt à passer à `notifyClient` pour un changement de statut donné.
 * Retourne null si aucun template dédié n'existe pour ce statut.
 */
export function buildClientStatusEmail(
  ctx: TemplateContext
): Omit<
  NotifyClientInput,
  "interventionId" | "companyId" | "clientId" | "fallbackEmail" | "sentByUid"
> | null {
  const builder = STATUS_TEMPLATES[ctx.toStatus];
  if (!builder) return null;
  return builder(ctx);
}

export const __TEST_TEMPLATES = STATUS_TEMPLATES;
