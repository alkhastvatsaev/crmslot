import type * as admin from "firebase-admin";
import type { Intervention } from "@/features/interventions/types";
import {
  isValidPortalAccessCode,
  normalizePortalAccessCode,
} from "@/features/interventions/portalAccessCode";
import {
  isValidPortalEmail,
  normalizePortalEmail,
  portalEmailsMatch,
} from "@/features/interventions/portalEmail";

export type PortalAccessCase = Pick<
  Intervention,
  | "id"
  | "status"
  | "title"
  | "problem"
  | "createdAt"
  | "clientFirstName"
  | "clientLastName"
  | "clientCompanyName"
  | "clientPhone"
  | "clientEmail"
  | "scheduledDate"
  | "scheduledTime"
  | "requestedDate"
  | "requestedTime"
  | "invoicePdfUrl"
  | "paymentStatus"
  | "invoiceAmountCents"
  | "stripePaymentLinkUrl"
  | "clientRating"
  | "clientComment"
>;

function toPortalAccessCase(id: string, data: Intervention): PortalAccessCase {
  return {
    id,
    status: data.status,
    title: data.title,
    problem: data.problem,
    createdAt: data.createdAt,
    clientFirstName: data.clientFirstName,
    clientLastName: data.clientLastName,
    clientCompanyName: data.clientCompanyName,
    clientPhone: data.clientPhone,
    clientEmail: data.clientEmail,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    requestedDate: data.requestedDate,
    requestedTime: data.requestedTime,
    invoicePdfUrl: data.invoicePdfUrl,
    paymentStatus: data.paymentStatus,
    invoiceAmountCents: data.invoiceAmountCents,
    stripePaymentLinkUrl: data.stripePaymentLinkUrl,
    clientRating: data.clientRating,
    clientComment: data.clientComment,
  };
}

/**
 * Vérifie le numéro de dossier, puis retourne le dossier et les autres dossiers du même e-mail.
 */
export async function verifyPortalAccessAdmin(params: {
  db: admin.firestore.Firestore;
  code: string;
  email?: string;
}): Promise<{ emailNormalized: string; interventions: PortalAccessCase[] }> {
  const code = normalizePortalAccessCode(params.code);
  const emailFilter = params.email?.trim() ? normalizePortalEmail(params.email) : "";

  if (!isValidPortalAccessCode(code)) {
    throw new Error("Numéro de dossier invalide.");
  }
  if (emailFilter && !isValidPortalEmail(emailFilter)) {
    throw new Error("E-mail invalide.");
  }

  const codeSnap = await params.db
    .collection("interventions")
    .where("portalAccessCode", "==", code)
    .limit(5)
    .get();

  if (codeSnap.empty) {
    throw new Error("Numéro de dossier incorrect.");
  }

  const codeMatches = emailFilter
    ? codeSnap.docs.filter((docSnap) => portalEmailsMatch(docSnap.data().clientEmail, emailFilter))
    : codeSnap.docs;

  if (codeMatches.length === 0) {
    throw new Error("Numéro de dossier incorrect.");
  }

  const primaryEmail = normalizePortalEmail(
    (codeMatches[0]!.data() as Intervention).clientEmail ?? ""
  );

  let rows = codeMatches.map((docSnap) =>
    toPortalAccessCase(docSnap.id, docSnap.data() as Intervention)
  );

  // Expansion vers tous les dossiers du même e-mail UNIQUEMENT si le visiteur
  // a prouvé qu'il connaît cet e-mail. Code seul → on ne révèle que le dossier matché.
  if (emailFilter && primaryEmail && isValidPortalEmail(primaryEmail)) {
    const emailSnap = await params.db
      .collection("interventions")
      .where("clientEmailNormalized", "==", primaryEmail)
      .limit(40)
      .get();

    if (!emailSnap.empty) {
      rows = emailSnap.docs.map((docSnap) =>
        toPortalAccessCase(docSnap.id, docSnap.data() as Intervention)
      );
    }
  }

  rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  return { emailNormalized: primaryEmail || emailFilter, interventions: rows };
}

export async function listPortalAccessCasesAdmin(params: {
  db: admin.firestore.Firestore;
  emailNormalized: string;
}): Promise<PortalAccessCase[]> {
  const snap = await params.db
    .collection("interventions")
    .where("clientEmailNormalized", "==", params.emailNormalized)
    .limit(40)
    .get();

  const rows = snap.docs.map((docSnap) =>
    toPortalAccessCase(docSnap.id, docSnap.data() as Intervention)
  );
  rows.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return rows;
}
