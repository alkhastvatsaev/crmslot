import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { autoAssignBestTechnicianAdmin } from "@/features/dispatch/server/autoAssignBestTechnicianAdmin";
import {
  getGmailMessageForChatbot,
  linkGmailToIntervention,
} from "@/features/chatbot/chatbot-gmail";
import { extractInterventionFieldsFromEmail } from "@/features/gmail/extractInterventionFieldsFromEmail";
import { geocodeAddressAdmin } from "@/features/gmail/server/geocodeAddressAdmin";
import { parseSenderEmail, parseSenderName } from "@/features/gmail/gmailSenderParse";
import { generatePortalAccessToken } from "@/features/interventions/portalToken";
import type { Intervention } from "@/features/interventions";

export type CreateInterventionFromGmailResult = {
  interventionId: string;
  autoAssigned: boolean;
  technicianName?: string;
};

/**
 * Crée un dossier intervention depuis un e-mail Gmail et l'assigne au meilleur technicien.
 * Différenciateur vs Synchroteam/Praxedo : zéro ressaisie, lien CRM automatique.
 */
export async function createInterventionFromGmailAdmin(params: {
  db: admin.firestore.Firestore;
  companyId: string;
  messageId: string;
  actorUid: string;
  autoAssign?: boolean;
}): Promise<CreateInterventionFromGmailResult> {
  const { db, companyId, messageId, actorUid } = params;
  const autoAssign = params.autoAssign !== false;

  const msg = await getGmailMessageForChatbot(messageId);
  const senderEmail = parseSenderEmail(msg.from);
  const clientName = parseSenderName(msg.from) || "Client";
  const haystack = `${msg.subject}\n${msg.bodyText}\n${msg.snippet}`;
  const extracted = extractInterventionFieldsFromEmail(haystack);
  const address = extracted.address ?? "Adresse à confirmer";
  const location = extracted.address ? await geocodeAddressAdmin(extracted.address) : null;
  const title = (msg.subject?.trim() || "Demande par e-mail").slice(0, 140);
  const now = new Date().toISOString();

  const ref = db.collection("interventions").doc();
  const doc: Record<string, unknown> = {
    title,
    address,
    time: "À planifier",
    status: extracted.address ? "pending" : "pending_needs_address",
    location: location ?? { lat: 50.8466, lng: 4.3522 },
    phone: extracted.phone,
    clientName,
    clientEmail: senderEmail || null,
    problem: msg.bodyText.slice(0, 2000) || msg.snippet || null,
    category: "autre",
    createdAt: now,
    updatedAt: now,
    companyId,
    createdByUid: actorUid,
    assignedTechnicianUid: null,
    portalAccessToken: generatePortalAccessToken(),
    sourceChannel: "gmail",
    gmailMessageId: messageId,
  };

  await ref.set(doc);

  await linkGmailToIntervention(
    { companyId, actorUid },
    { messageId, interventionId: ref.id, note: "Dossier créé depuis Gmail (1 clic)" }
  );

  let autoAssigned = false;
  let technicianName: string | undefined;

  if (autoAssign) {
    const iv = { id: ref.id, ...doc } as Intervention;
    const assign = await autoAssignBestTechnicianAdmin({
      db,
      interventionId: ref.id,
      iv,
      actorUid,
    });
    autoAssigned = assign.assigned;
    technicianName = assign.technicianName;
  }

  await ref.update({
    updatedAt: FieldValue.serverTimestamp(),
    ...(autoAssigned ? { dispatchMode: "ai_auto" } : {}),
  });

  return {
    interventionId: ref.id,
    autoAssigned,
    technicianName,
  };
}
