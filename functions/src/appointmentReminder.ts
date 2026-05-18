import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

function publicOrigin(): string {
  const raw = process.env.PUBLIC_APP_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

function tomorrowIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });
}

async function listTokens(uid: string): Promise<string[]> {
  const snap = await admin.firestore().collection("users").doc(uid).collection("fcm_tokens").get();
  return snap.docs.map((doc) => (doc.data().token as string) ?? "").filter((t) => t.length > 0);
}

/** Rappel matinal pour les interventions planifiées le lendemain. */
export async function runAppointmentReminders(): Promise<void> {
  const db = admin.firestore();
  const dateKey = tomorrowIsoDate();
  const snap = await db
    .collection("interventions")
    .where("scheduledDate", "==", dateKey)
    .get();

  const byTech = new Map<string, number>();

  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const status = typeof d.status === "string" ? d.status : "";
    if (status === "done" || status === "invoiced" || status === "cancelled") continue;
    const uid = typeof d.assignedTechnicianUid === "string" ? d.assignedTechnicianUid : "";
    if (!uid) continue;
    byTech.set(uid, (byTech.get(uid) ?? 0) + 1);
  }

  const link = `${publicOrigin()}/?bmTechReminder=1`;

  for (const [uid, count] of byTech) {
    const tokens = await listTokens(uid);
    if (!tokens.length) continue;
    const body =
      count === 1
        ? "1 intervention planifiée demain"
        : `${count} interventions planifiées demain`;

    await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Rappel planning",
        body,
      },
      data: {
        type: "appointment_reminder",
        date: dateKey,
      },
      webpush: { fcmOptions: { link } },
    });
  }

  logger.info("Appointment reminders sent", { dateKey, technicians: byTech.size });
}
