import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const NOTIFY_STATUSES = new Set([
  "assigned",
  "en_route",
  "in_progress",
  "waiting_material",
  "done",
  "cancelled",
]);

const STATUS_LABELS: Record<string, string> = {
  assigned: "Technicien assigné",
  en_route: "En route",
  in_progress: "En cours",
  waiting_material: "En attente matériel",
  done: "Terminé",
  invoiced: "Facturé",
  cancelled: "Annulé",
  pending: "En attente",
};

function publicOrigin(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

function caseLink(interventionId: string): string {
  return `${publicOrigin()}/?bmTechCase=${encodeURIComponent(interventionId)}`;
}

async function listTokens(uid: string): Promise<string[]> {
  const snap = await admin.firestore().collection("users").doc(uid).collection("fcm_tokens").get();
  return snap.docs.map((d) => (d.data().token as string) ?? "").filter((t) => t.length > 0);
}

async function sendToTokens(
  tokens: string[],
  payload: Omit<admin.messaging.MulticastMessage, "tokens">,
): Promise<void> {
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({ tokens, ...payload });
  logger.info("FCM status multicast", { ok: res.successCount, fail: res.failureCount });
}

function notificationTargets(
  data: admin.firestore.DocumentData,
  toStatus: string,
): string[] {
  const targets = new Set<string>();
  const tech =
    typeof data.assignedTechnicianUid === "string" ? data.assignedTechnicianUid.trim() : "";
  const creator = typeof data.createdByUid === "string" ? data.createdByUid.trim() : "";
  if (tech) targets.add(tech);
  if (creator) targets.add(creator);
  if (toStatus === "assigned" && tech) targets.add(tech);
  return [...targets];
}

/** Push FCM lors d’un changement de statut (hors assignation — gérée à part). */
export async function notifyInterventionStatusChange(params: {
  interventionId: string;
  before?: admin.firestore.DocumentData;
  after: admin.firestore.DocumentData;
}): Promise<void> {
  const { interventionId, before, after } = params;
  const prevStatus = typeof before?.status === "string" ? before.status : "";
  const nextStatus = typeof after.status === "string" ? after.status : "";
  if (!nextStatus || nextStatus === prevStatus) return;
  if (!NOTIFY_STATUSES.has(nextStatus)) return;

  // Assignation déjà couverte par notifyTechnicianInterventionAssigned
  if (nextStatus === "assigned" && prevStatus !== "assigned") return;

  const title =
    typeof after.title === "string" && after.title.length > 0
      ? after.title.slice(0, 80)
      : "Mise à jour dossier";

  const label = STATUS_LABELS[nextStatus] ?? nextStatus;
  const body = `Statut : ${label}`;

  const uids = notificationTargets(after, nextStatus);
  const link = caseLink(interventionId);

  for (const uid of uids) {
    const tokens = await listTokens(uid);
    if (!tokens.length) continue;
    await sendToTokens(tokens, {
      notification: { title, body },
      data: {
        type: "status_change",
        interventionId,
        fromStatus: prevStatus,
        toStatus: nextStatus,
      },
      webpush: { fcmOptions: { link } },
    });
  }
}
