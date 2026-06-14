import type * as admin from "firebase-admin";
import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
import {
  isGmailConfigured,
  sendInterventionEmail,
} from "@/core/services/email/sendInterventionEmail";
import type { Intervention } from "@/features/interventions/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "Demande enregistrée",
  pending_needs_address: "Adresse à compléter",
  assigned: "Technicien assigné",
  en_route: "Technicien en route",
  on_site: "Technicien sur place",
  in_progress: "Intervention en cours",
  waiting_material: "En attente de matériel",
  done: "Intervention terminée",
  invoiced: "Facture disponible",
  cancelled: "Intervention annulée",
};

export async function sendPortalStatusUpdateEmailAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv: Pick<
    Intervention,
    | "status"
    | "companyId"
    | "clientEmail"
    | "clientFirstName"
    | "portalAccessToken"
    | "title"
    | "problem"
    | "createdByUid"
  >;
  fromStatus: Intervention["status"];
  toStatus: Intervention["status"];
}): Promise<boolean> {
  if (params.fromStatus === params.toStatus) return false;

  const email = (params.iv.clientEmail ?? "").trim();
  const companyId = String(params.iv.companyId ?? "").trim();
  const token = params.iv.portalAccessToken?.trim();
  if (!email || !companyId || !token || !isGmailConfigured()) return false;

  const label = STATUS_LABELS[params.toStatus ?? ""] ?? "Mise à jour de votre dossier";
  const portalUrl = buildPortalSuiviUrl(token);
  const problem = (params.iv.title || params.iv.problem || "Votre intervention").trim();
  const hello = params.iv.clientFirstName?.trim()
    ? `Bonjour ${params.iv.clientFirstName.trim()},`
    : "Bonjour,";

  const result = await sendInterventionEmail({
    interventionId: params.interventionId,
    companyId,
    to: email,
    subject: `Suivi BELGMAP — ${label}`,
    bodyText: [
      hello,
      "",
      `Votre dossier « ${problem} » est passé à l'étape : ${label}.`,
      "",
      `Suivre en ligne : ${portalUrl}`,
      "",
      "— BELGMAP",
    ].join("\n"),
    sentByUid: params.iv.createdByUid ?? "portal",
    sentVia: "portal_status_update",
  });

  return result.ok;
}
