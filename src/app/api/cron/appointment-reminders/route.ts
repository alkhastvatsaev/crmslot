import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";
import {
  buildReminderMessage,
  findDueReminders,
} from "@/features/notifications/appointmentReminders";
import { notifyClient } from "@/core/services/email/clientNotifications/notifyClient";
import { buildClientAppointmentReminderEmail } from "@/core/services/email/clientNotifications/clientExtraTemplates";
import { sendNativePushToUser } from "@/features/notifications";
import type { Intervention } from "@/features/interventions";

function pushTitleFor(reminderType: "24h" | "2h" | "30min", role: "client" | "tech"): string {
  if (reminderType === "24h") return role === "tech" ? "RDV demain" : "Rappel RDV demain";
  if (reminderType === "2h") return role === "tech" ? "Mission dans 2h" : "RDV dans 2h";
  return role === "tech" ? "Mission imminente" : "Votre tech arrive bientôt";
}

function pushBodyFor(
  reminderType: "24h" | "2h" | "30min",
  role: "client" | "tech",
  title: string,
  address: string,
  scheduledTime: string
): string {
  const where = address || "adresse à confirmer";
  const when = scheduledTime || "horaire à confirmer";
  if (role === "tech") return `${title} — ${where} à ${when}`;
  return reminderType === "30min"
    ? `Votre technicien arrive — préparez l'accès`
    : `${title} — ${when} à ${where}`;
}

export const runtime = "nodejs";

/**
 * GET /api/cron/appointment-reminders — rappels client 24h / 2h / 30min avant RDV.
 * Auth : Bearer CRON_SECRET (Vercel Cron).
 */
export async function GET(request: Request) {
  const guard = requireCronSecret(request);
  if (guard) return guard;

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const db = getAdminDb();
  const snap = await db
    .collection("interventions")
    .where("status", "in", ["assigned", "en_route", "in_progress"])
    .get();

  const interventions = snap.docs.map((d) => ({ ...(d.data() as Intervention), id: d.id }));
  const due = findDueReminders(interventions);
  let sent = 0;

  for (const candidate of due) {
    const reminderType = candidate.reminderType;
    const interventionId = candidate.intervention.id;
    const msg = buildReminderMessage(candidate);
    try {
      const base =
        process.env.NEXT_PUBLIC_BASE_URL ??
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const res = await fetch(`${base}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "sms",
          recipientRole: "client",
          subjectKey: "appointment_reminder",
          bodyKey: "appointment_reminder_body",
          variables: {
            subject: msg.subject,
            body: msg.body,
            clientPhone: candidate.intervention.clientPhone ?? "",
          },
        }),
      });
      if (res.ok) {
        sent += 1;
        const sentAt = new Date().toISOString();
        await db
          .collection("interventions")
          .doc(interventionId)
          .update({
            [`appointmentRemindersSent.${reminderType}`]: sentAt,
          });
      }
    } catch {
      // Ne pas bloquer le cron sur un échec d'envoi.
    }

    // Email companion + push client/tech (best-effort, ne bloque pas le cron)
    try {
      const fullSnap = await db.collection("interventions").doc(interventionId).get();
      const full = (fullSnap.data() ?? {}) as Intervention;
      const companyId = String(full.companyId ?? "").trim();
      const title = (full.title || full.problem || "Intervention").trim();
      const address = (full.address ?? "").trim();
      const scheduledTime = (full.scheduledTime ?? "").trim();

      // Push client portail (FCM)
      const clientUid = (full.createdByUid ?? "").trim();
      if (clientUid) {
        void sendNativePushToUser({
          uid: clientUid,
          title: pushTitleFor(reminderType, "client"),
          body: pushBodyFor(reminderType, "client", title, address, scheduledTime),
          data: {
            type: "appointment_reminder",
            bmClientCase: interventionId,
            bmInterventionId: interventionId,
            reminderType,
          },
        }).catch(() => {});
      }

      // Push technicien assigné
      const techUid = (full.assignedTechnicianUid ?? "").trim();
      if (techUid) {
        void sendNativePushToUser({
          uid: techUid,
          title: pushTitleFor(reminderType, "tech"),
          body: pushBodyFor(reminderType, "tech", title, address, scheduledTime),
          data: {
            type: "appointment_reminder",
            bmTechCase: interventionId,
            bmInterventionId: interventionId,
            reminderType,
          },
        }).catch(() => {});
      }

      if (companyId) {
        const payload = buildClientAppointmentReminderEmail({
          interventionId,
          iv: {
            clientFirstName: full.clientFirstName ?? null,
            title: full.title ?? null,
            problem: full.problem ?? null,
            address: full.address ?? null,
            portalAccessToken: full.portalAccessToken ?? null,
          },
          whenLabel: msg.subject || msg.body,
          reminderType,
        });
        await notifyClient({
          interventionId,
          companyId,
          clientId: full.clientId ?? null,
          fallbackEmail: full.clientEmail ?? null,
          sentByUid: "cron-appointment-reminder",
          ...payload,
        });
      }
    } catch {
      // best-effort
    }
  }

  return NextResponse.json({ ok: true, due: due.length, sent });
}
