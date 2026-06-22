import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { requireCronSecret } from "@/core/api/routeAuth";
import {
  findLateInterventions,
  findUnpaidInvoices,
  type UnpaidReminderKey,
} from "@/features/notifications/operationsTick";
import { sendNativePushToUser } from "@/features/notifications/sendNativePushAdmin";
import { notifyCompanyAdminsPush } from "@/features/notifications/notifyCompanyAdminsPush";
import type { Intervention } from "@/features/interventions/types";

export const runtime = "nodejs";

function formatAmountEur(cents: number | null | undefined): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

/**
 * GET /api/cron/operations-tick — détecte les retards et les factures impayées.
 *
 * Deux passes :
 *  1. Tech en retard (assigned/en_route + scheduledTime + 15 min dépassé sans notif)
 *     → push admin (réassigner / appeler client) + push client (le tech est en retard).
 *  2. Factures impayées (J+7, J+14 post `invoicedAt`)
 *     → push client portail (rappel paiement).
 *
 * Auth : Bearer CRON_SECRET (Vercel Cron). Idempotent grâce aux flags
 * `lateNotificationSentAt` et `unpaidReminders.j{7,14}`.
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
  const now = new Date();
  const report = {
    lateDetected: 0,
    lateNotified: 0,
    unpaidDetected: 0,
    unpaidNotified: 0,
  };

  // ─── Pass 1 : Tech en retard ──────────────────────────────────────────────
  const activeSnap = await db
    .collection("interventions")
    .where("status", "in", ["assigned", "en_route"])
    .get();
  const activeInterventions = activeSnap.docs.map(
    (d) => ({ ...(d.data() as Intervention), id: d.id }) as Intervention
  );
  const lateCandidates = findLateInterventions(activeInterventions, now);
  report.lateDetected = lateCandidates.length;

  for (const { intervention, minutesLate } of lateCandidates) {
    const interventionId = intervention.id;
    const title = (intervention.title || intervention.problem || "Dossier").trim();
    const data = {
      type: "tech_late",
      bmInterventionId: interventionId,
    };

    // Admin : action urgente
    if (intervention.companyId) {
      void notifyCompanyAdminsPush({
        companyId: intervention.companyId,
        title: "Technicien en retard",
        body: `${title} — retard ${minutesLate} min`,
        data: { ...data, minutesLate: String(minutesLate) },
      }).catch(() => {});
    }

    // Client : info pour anticiper
    const clientUid = (intervention.createdByUid ?? "").trim();
    if (clientUid) {
      void sendNativePushToUser({
        uid: clientUid,
        title: "Léger retard",
        body: `Votre technicien arrive avec un peu de retard (${minutesLate} min)`,
        data: { ...data, bmClientCase: interventionId },
      }).catch(() => {});
    }

    await db
      .collection("interventions")
      .doc(interventionId)
      .update({ lateNotificationSentAt: now.toISOString() })
      .catch(() => {});
    report.lateNotified += 1;
  }

  // ─── Pass 2 : Factures impayées (J+7, J+14) ───────────────────────────────
  const invoicedSnap = await db.collection("interventions").where("status", "==", "invoiced").get();
  const invoiced = invoicedSnap.docs.map(
    (d) => ({ ...(d.data() as Intervention), id: d.id }) as Intervention
  );
  const unpaidCandidates = findUnpaidInvoices(invoiced, now);
  report.unpaidDetected = unpaidCandidates.length;

  for (const { intervention, reminderKey } of unpaidCandidates) {
    const interventionId = intervention.id;
    const title = (intervention.title || "Dossier").trim();
    const amountLabel = formatAmountEur(intervention.invoiceAmountCents);
    const clientUid = (intervention.createdByUid ?? "").trim();

    if (clientUid) {
      void sendNativePushToUser({
        uid: clientUid,
        title:
          reminderKey === 7
            ? "Facture en attente de paiement"
            : "Rappel important — facture impayée",
        body: amountLabel ? `${title} — ${amountLabel}` : `${title} — pensez à régler la facture`,
        data: {
          type: "unpaid_invoice_reminder",
          bmClientCase: interventionId,
          bmInterventionId: interventionId,
          reminderKey: `j${reminderKey}` as `j${UnpaidReminderKey}`,
        },
      }).catch(() => {});
    }

    const flagKey = `unpaidReminders.j${reminderKey}` as const;
    await db
      .collection("interventions")
      .doc(interventionId)
      .update({ [flagKey]: now.toISOString() })
      .catch(() => {});
    report.unpaidNotified += 1;
  }

  return NextResponse.json({ ok: true, ...report });
}
