import type * as admin from "firebase-admin";
import { buildPortalSuiviUrl } from "@/core/config/publicAppUrl";
import { logger } from "@/core/logger";
import {
  isGmailConfigured,
  sendInterventionEmail,
} from "@/core/services/email/sendInterventionEmail";
import type { Intervention } from "@/features/interventions/types";
import { formatPortalAccessCode } from "@/features/interventions/portalAccessCode";
import { ensurePortalAccessTokenAdmin } from "@/features/interventions/server/ensurePortalAccessTokenAdmin";

function buildPortalAccessEmail(params: {
  firstName: string | null;
  code: string;
  portalUrl: string;
  problem: string;
}): { subject: string; bodyText: string } {
  const hello = params.firstName?.trim() ? `Bonjour ${params.firstName.trim()},` : "Bonjour,";
  return {
    subject: "Votre suivi d'intervention BELGMAP",
    bodyText: [
      hello,
      "",
      "Votre demande a bien été enregistrée.",
      "",
      `Problème : ${params.problem}`,
      `Numéro de dossier : ${formatPortalAccessCode(params.code)}`,
      `Lien direct : ${params.portalUrl}`,
      "",
      "Vous pouvez aussi saisir votre e-mail et ce numéro dans l'onglet « Suivi dossier » de BELGMAP.",
      "Vous recevrez un e-mail à chaque étape importante.",
      "",
      "— BELGMAP",
    ].join("\n"),
  };
}

export type PortalAccessNotifyResult = {
  emailSent: boolean;
  portalUrl: string;
  portalAccessCode: string | null;
};

export async function notifyPortalAccessAdmin(params: {
  db: admin.firestore.Firestore;
  interventionId: string;
  iv?: Intervention;
}): Promise<PortalAccessNotifyResult> {
  const snap = params.iv
    ? null
    : await params.db.collection("interventions").doc(params.interventionId).get();
  if (!params.iv && (!snap || !snap.exists)) {
    throw new Error("Intervention introuvable.");
  }

  const iv = params.iv ?? ({ id: snap!.id, ...snap!.data() } as Intervention);
  const companyId = String(iv.companyId ?? "").trim();
  if (!companyId) {
    throw new Error("Société manquante.");
  }

  const email = (iv.clientEmail ?? "").trim();
  if (!email) {
    throw new Error("E-mail client manquant.");
  }

  const portalAccessToken = await ensurePortalAccessTokenAdmin(
    params.db,
    params.interventionId,
    iv
  );
  let portalAccessCode = iv.portalAccessCode?.trim() || null;
  if (!portalAccessCode) {
    const { generatePortalAccessCode } = await import("@/features/interventions/portalAccessCode");
    portalAccessCode = generatePortalAccessCode();
    await params.db.collection("interventions").doc(params.interventionId).update({
      portalAccessCode,
    });
  }

  const portalUrl = buildPortalSuiviUrl(portalAccessToken);
  const problem = (iv.title || iv.problem || "Votre intervention").trim();

  let emailSent = false;

  if (!isGmailConfigured()) {
    logger.warn("[portalAccessNotifyAdmin] Gmail not configured — welcome email skipped");
  } else {
    const mail = buildPortalAccessEmail({
      firstName: iv.clientFirstName ?? null,
      code: portalAccessCode,
      portalUrl,
      problem,
    });
    const result = await sendInterventionEmail({
      interventionId: params.interventionId,
      companyId,
      to: email,
      subject: mail.subject,
      bodyText: mail.bodyText,
      sentByUid: iv.createdByUid ?? "portal",
      sentVia: "portal_access_welcome",
      attachDocumentType: "none",
    });
    emailSent = result.ok;
    if (!result.ok) {
      logger.warn("[portalAccessNotifyAdmin] welcome email failed", {
        interventionId: params.interventionId,
        to: email,
        error: result.error,
      });
    }
  }

  return { emailSent, portalUrl, portalAccessCode };
}
