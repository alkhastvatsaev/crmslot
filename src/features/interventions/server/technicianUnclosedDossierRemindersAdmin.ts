import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Intervention } from "@/features/interventions/types";
import { sendNativePushToUser } from "@/features/notifications/index.server";
import { BM_TECH_CASE_PARAM } from "@/features/notifications/notificationConstants";
import { isTechnicianClosureBlockEnabledForCompany } from "@/features/interventions/server/technicianClosureBlockServer";
import {
  buildUnclosedDossierPushMessage,
  toUnclosedDossierReminderCandidates,
  UNCLOSED_DOSSIER_ACTIVE_STATUSES,
  UNCLOSED_DOSSIER_PUSH_TYPE,
  shouldSendUnclosedDossierReminder,
} from "@/features/interventions/technicianUnclosedDossierReminders";
import { logger } from "@/core/logger";

export type TechnicianUnclosedDossierRemindersReport = {
  scanned: number;
  candidates: number;
  sent: number;
  skippedFlag: number;
  skippedThrottle: number;
  failed: number;
};

const PUSH_META_COLLECTION = "push_meta";
const PUSH_META_DOC = "unclosed_dossier";

async function readLastUnclosedReminderSentAt(
  db: admin.firestore.Firestore,
  technicianUid: string
): Promise<string | null> {
  const snap = await db
    .collection("users")
    .doc(technicianUid)
    .collection(PUSH_META_COLLECTION)
    .doc(PUSH_META_DOC)
    .get();
  const raw = snap.data()?.lastSentAt;
  return typeof raw === "string" ? raw : null;
}

async function writeUnclosedReminderSent(
  db: admin.firestore.Firestore,
  technicianUid: string,
  payload: { openCount: number; primaryInterventionId: string }
): Promise<void> {
  await db
    .collection("users")
    .doc(technicianUid)
    .collection(PUSH_META_COLLECTION)
    .doc(PUSH_META_DOC)
    .set(
      {
        lastSentAt: new Date().toISOString(),
        openCount: payload.openCount,
        primaryInterventionId: payload.primaryInterventionId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
}

/**
 * Cron — push FCM technicien tant qu'il reste des dossiers non clôturés.
 * Throttle par technicien (6 h par défaut).
 */
export async function runTechnicianUnclosedDossierRemindersAdmin(
  db: admin.firestore.Firestore,
  now = new Date()
): Promise<TechnicianUnclosedDossierRemindersReport> {
  const report: TechnicianUnclosedDossierRemindersReport = {
    scanned: 0,
    candidates: 0,
    sent: 0,
    skippedFlag: 0,
    skippedThrottle: 0,
    failed: 0,
  };

  const snap = await db
    .collection("interventions")
    .where("status", "in", UNCLOSED_DOSSIER_ACTIVE_STATUSES)
    .get();

  const interventions = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Intervention);
  report.scanned = interventions.length;

  const candidates = toUnclosedDossierReminderCandidates(interventions);
  report.candidates = candidates.length;

  const companyFlagCache = new Map<string, boolean>();

  for (const candidate of candidates) {
    let enabled = companyFlagCache.get(candidate.companyId);
    if (enabled === undefined) {
      enabled = await isTechnicianClosureBlockEnabledForCompany(db, candidate.companyId);
      companyFlagCache.set(candidate.companyId, enabled);
    }
    if (!enabled) {
      report.skippedFlag += 1;
      continue;
    }

    const lastSentAt = await readLastUnclosedReminderSentAt(db, candidate.technicianUid);
    if (!shouldSendUnclosedDossierReminder(lastSentAt, now)) {
      report.skippedThrottle += 1;
      continue;
    }

    const { title, body } = buildUnclosedDossierPushMessage(candidate.unclosed, candidate.primary);
    const interventionId = candidate.primary.id;
    const openCount = String(candidate.unclosed.length);

    try {
      const pushReport = await sendNativePushToUser({
        uid: candidate.technicianUid,
        title,
        body,
        audiences: ["technician"],
        data: {
          type: UNCLOSED_DOSSIER_PUSH_TYPE,
          interventionId,
          [BM_TECH_CASE_PARAM]: interventionId,
          audience: "technician",
          openCount,
        },
      });

      if (pushReport.sent > 0) {
        await writeUnclosedReminderSent(db, candidate.technicianUid, {
          openCount: candidate.unclosed.length,
          primaryInterventionId: interventionId,
        });
        report.sent += 1;
      } else {
        report.skippedThrottle += 1;
      }
    } catch (err) {
      report.failed += 1;
      logger.warn("[technicianUnclosedDossierReminders] push failed", {
        technicianUid: candidate.technicianUid,
        interventionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return report;
}
