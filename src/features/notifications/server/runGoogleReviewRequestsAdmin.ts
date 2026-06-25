import type * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { isGmailConfigured } from "@/core/services/email/sendInterventionEmail";
import { notifyClient } from "@/core/services/email/clientNotifications/notifyClient";
import { buildGoogleReviewRequestEmail } from "@/core/services/email/clientNotifications/clientExtraTemplates";
import { featureFlagsFromEnv, mergeFeatureFlags } from "@/core/featureFlags";
import type { Intervention } from "@/features/interventions";
import {
  findGoogleReviewCandidates,
  GOOGLE_REVIEW_MAX_SENDS_PER_COMPANY,
  GOOGLE_REVIEW_MAX_SENDS_PER_RUN,
  parseGoogleReviewCompanyConfig,
  type GoogleReviewCompanyConfig,
} from "@/features/notifications/googleReviewRequest";
import { logger } from "@/core/logger";

export type GoogleReviewRequestsReport = {
  companiesEnabled: number;
  scanned: number;
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
};

async function loadCompanyReviewConfigs(
  db: admin.firestore.Firestore
): Promise<GoogleReviewCompanyConfig[]> {
  const snap = await db.collection("companies").get();
  const configs: GoogleReviewCompanyConfig[] = [];

  for (const doc of snap.docs) {
    const flags = mergeFeatureFlags(
      featureFlagsFromEnv(),
      (doc.data()?.featureFlags as Partial<ReturnType<typeof featureFlagsFromEnv>>) ?? null
    );
    if (!flags.googleReviewRequest) continue;

    const config = parseGoogleReviewCompanyConfig(doc.id, doc.data());
    if (config) configs.push(config);
  }

  return configs;
}

async function fetchInterventionsForConfig(
  db: admin.firestore.Firestore,
  config: GoogleReviewCompanyConfig
): Promise<Intervention[]> {
  const base = db.collection("interventions").where("companyId", "==", config.companyId);

  const snap =
    config.trigger === "paid"
      ? await base.where("paymentStatus", "==", "paid").limit(80).get()
      : await base.where("status", "in", ["done", "invoiced"]).limit(80).get();

  return snap.docs.map((d) => ({ ...(d.data() as Intervention), id: d.id }));
}

/**
 * Cron — envoie au plus un email « avis Google » par dossier, après délai configurable.
 * Mail séparé des notifications transactionnelles ; respecte opt-out client.
 */
export async function runGoogleReviewRequestsAdmin(
  db: admin.firestore.Firestore,
  now = new Date()
): Promise<GoogleReviewRequestsReport> {
  const report: GoogleReviewRequestsReport = {
    companiesEnabled: 0,
    scanned: 0,
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  if (!isGmailConfigured()) {
    logger.info("[googleReview] skipped — Gmail not configured");
    return report;
  }

  const configs = await loadCompanyReviewConfigs(db);
  report.companiesEnabled = configs.length;
  if (configs.length === 0) return report;

  let sentThisRun = 0;

  for (const config of configs) {
    if (sentThisRun >= GOOGLE_REVIEW_MAX_SENDS_PER_RUN) break;

    let sentForCompany = 0;
    const interventions = await fetchInterventionsForConfig(db, config);
    report.scanned += interventions.length;

    const candidates = findGoogleReviewCandidates(interventions, config, now);
    report.eligible += candidates.length;

    for (const { intervention, config: companyConfig } of candidates) {
      if (sentThisRun >= GOOGLE_REVIEW_MAX_SENDS_PER_RUN) break;
      if (sentForCompany >= GOOGLE_REVIEW_MAX_SENDS_PER_COMPANY) break;

      const interventionId = intervention.id;
      const companyId = intervention.companyId?.trim();
      if (!interventionId || !companyId) {
        report.skipped += 1;
        continue;
      }

      const emailPayload = buildGoogleReviewRequestEmail({
        interventionId,
        iv: intervention,
        reviewUrl: companyConfig.reviewUrl,
      });

      try {
        const result = await notifyClient({
          interventionId,
          companyId,
          clientId: intervention.clientId ?? null,
          fallbackEmail: intervention.clientEmail ?? null,
          sentByUid: "cron-google-review",
          ...emailPayload,
        });

        if (!result.ok) {
          report.failed += 1;
          continue;
        }

        if ("skipped" in result && result.skipped) {
          report.skipped += 1;
          continue;
        }

        await db.collection("interventions").doc(interventionId).update({
          googleReviewRequestSentAt: now.toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        report.sent += 1;
        sentThisRun += 1;
        sentForCompany += 1;
      } catch (err) {
        report.failed += 1;
        logger.warn("[googleReview] send failed", {
          interventionId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return report;
}
