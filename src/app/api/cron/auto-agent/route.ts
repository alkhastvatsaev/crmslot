import "@/core/config/firebase-admin";
import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminReady } from "@/core/config/firebase-admin";
import { buildInterventionReminders } from "@/features/reminders/interventionReminders";
import { computeContractChurnRisks } from "@/features/clients/contractChurnRisk";
import { loadTechniciansAdmin } from "@/features/dispatch/server/loadTechniciansAdmin";
import { haversineDistanceKm } from "@/features/dispatch/rankTechniciansForIntervention";
import { buildAssignInterventionToTechnicianUpdate } from "@/features/interventions/assignInterventionToTechnician";
import {
  canResolveTechnicianAssignUid,
  resolveTechnicianAssignUid,
} from "@/features/dispatch/technicianAssignUid";
import { sendInterventionEmail } from "@/core/services/email/sendInterventionEmail";
import type { Intervention } from "@/features/interventions/types";
import type { MaintenanceContract } from "@/features/maintenance/types";

export const runtime = "nodejs";

const CRON_ACTOR_UID = "cron-auto-agent";
const UNPAID_REMINDER_DAYS = 7;
const CHURN_REMINDER_DAYS = 3;

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) return false;
  const bearer = request.headers.get("authorization")?.trim();
  const header = request.headers.get("x-cron-secret")?.trim();
  return bearer === `Bearer ${cronSecret}` || header === cronSecret;
}

/**
 * GET /api/cron/auto-agent — automatise les relances, le dispatch et la rétention.
 * Tourne toutes les heures via Vercel Cron. Auth : CRON_SECRET.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: "Firebase Admin not configured" },
      { status: 503 }
    );
  }

  const db = getAdminDb();
  const now = new Date();
  const nowMs = now.getTime();

  const stats = { dispatched: 0, relancesSent: 0, churnAlerts: 0, errors: 0 };

  // ── Load companies ────────────────────────────────────────────────────────
  const companiesSnap = await db.collection("companies").get();

  // ── Load all technicians once (global collection) ─────────────────────────
  const allTechnicians = await loadTechniciansAdmin(db);

  for (const companyDoc of companiesSnap.docs) {
    const companyId = companyDoc.id;
    const companyData = companyDoc.data() as { name?: string; adminEmail?: string };
    const adminEmail = companyData.adminEmail?.trim() ?? "";

    const techs = allTechnicians.filter(
      (t) =>
        (t as unknown as { companyId?: string }).companyId === companyId &&
        t.status === "available" &&
        canResolveTechnicianAssignUid(t) &&
        typeof t.location?.lat === "number" &&
        typeof t.location?.lng === "number"
    );

    try {
      // ── 1. Load active interventions for this company ─────────────────────
      const ivsSnap = await db
        .collection("interventions")
        .where("companyId", "==", companyId)
        .where("status", "in", [
          "pending",
          "pending_needs_address",
          "assigned",
          "done",
          "invoiced",
          "waiting_material",
        ])
        .limit(300)
        .get();

      const interventions = ivsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Intervention, "id">),
      }));

      // ── 2. AUTO-DISPATCH: unassigned stale pending interventions ──────────
      const reminders = buildInterventionReminders(interventions, nowMs);
      const toDispatch = reminders.filter((r) => r.kind === "unassigned_stale");

      for (const reminder of toDispatch) {
        const iv = interventions.find((x) => x.id === reminder.interventionId);
        if (!iv || !iv.location?.lat || !iv.location?.lng || techs.length === 0) continue;

        // Find closest available technician by haversine
        const sorted = [...techs].sort(
          (a, b) =>
            haversineDistanceKm(iv.location.lat, iv.location.lng, a.location.lat, a.location.lng) -
            haversineDistanceKm(iv.location.lat, iv.location.lng, b.location.lat, b.location.lng)
        );
        const best = sorted[0]!;
        const techUid = resolveTechnicianAssignUid(best);

        const patch = buildAssignInterventionToTechnicianUpdate(iv, techUid, now);
        try {
          await db
            .collection("interventions")
            .doc(iv.id)
            .update({
              ...patch,
              statusUpdatedAt: now.toISOString(),
              autoDispatchedAt: now.toISOString(),
            });
          stats.dispatched++;
        } catch {
          stats.errors++;
        }
      }

      // ── 3. RELANCES: invoiced unpaid > UNPAID_REMINDER_DAYS ───────────────
      const DAY_MS = 86_400_000;
      const unpaidInvoiced = interventions.filter((iv) => {
        if (iv.status !== "invoiced") return false;
        if (iv.paymentStatus === "paid") return false;
        const invoicedAt = iv.invoicedAt ?? iv.statusUpdatedAt ?? iv.createdAt ?? "";
        if (!invoicedAt) return false;
        const ageDays = (nowMs - new Date(invoicedAt).getTime()) / DAY_MS;
        if (ageDays < UNPAID_REMINDER_DAYS) return false;
        // Avoid re-sending within 3 days
        const lastReminder = (iv as unknown as Record<string, string>).lastPaymentReminderAt ?? "";
        if (lastReminder) {
          const reminderAgeDays = (nowMs - new Date(lastReminder).getTime()) / DAY_MS;
          if (reminderAgeDays < 3) return false;
        }
        return Boolean(iv.clientEmail?.trim());
      });

      for (const iv of unpaidInvoiced) {
        const clientEmail = iv.clientEmail!.trim();
        const clientName = iv.clientName ?? iv.clientFirstName ?? "Client";
        const invoiceNumber = iv.invoiceNumber ? ` (${iv.invoiceNumber})` : "";
        try {
          await sendInterventionEmail({
            interventionId: iv.id,
            companyId,
            to: clientEmail,
            subject: `Rappel de paiement${invoiceNumber} — ${companyData.name ?? "Votre prestataire"}`,
            bodyText:
              `Bonjour ${clientName},\n\n` +
              `Nous vous rappelons que votre facture${invoiceNumber} est en attente de règlement.\n` +
              `Merci de procéder au paiement dans les meilleurs délais.\n\n` +
              `Pour toute question, n'hésitez pas à nous contacter.\n\n` +
              `Cordialement,\n${companyData.name ?? "Votre prestataire"}`,
            sentByUid: CRON_ACTOR_UID,
            attachDocumentType: "invoice",
          });
          await db
            .collection("interventions")
            .doc(iv.id)
            .update({ lastPaymentReminderAt: now.toISOString() });
          stats.relancesSent++;
        } catch {
          stats.errors++;
        }
      }

      // ── 4. CHURN RISK: at_risk contracts → alerte email admin ────────────
      const contractsSnap = await db
        .collection("companies")
        .doc(companyId)
        .collection("maintenanceContracts")
        .where("isActive", "==", true)
        .limit(100)
        .get();

      if (contractsSnap.size > 0 && adminEmail) {
        const contracts = contractsSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MaintenanceContract, "id">),
        }));
        const risks = computeContractChurnRisks(contracts, interventions, now);
        const atRisk = risks.filter((r) => r.riskLevel === "at_risk");

        for (const risk of atRisk) {
          const lastAlertField = `churnAlertSentAt_${risk.contractId}`;
          const contractDoc = contractsSnap.docs.find((d) => d.id === risk.contractId);
          if (!contractDoc) continue;
          const lastAlert = (contractDoc.data() as Record<string, string>)[lastAlertField] ?? "";
          if (lastAlert) {
            const ageDays = (nowMs - new Date(lastAlert).getTime()) / DAY_MS;
            if (ageDays < CHURN_REMINDER_DAYS) continue;
          }

          const factors = risk.riskFactors.join(", ");
          try {
            await sendInterventionEmail({
              interventionId: risk.contractId,
              companyId,
              to: adminEmail,
              subject: `⚠️ Contrat à risque — ${risk.contractLabel}`,
              bodyText:
                `Alerte rétention client :\n\n` +
                `Contrat : ${risk.contractLabel}\n` +
                `Score de risque : ${risk.riskScore}/100\n` +
                `Facteurs : ${factors}\n\n` +
                `Dernier contact : ${risk.lastInterventionDaysAgo !== null ? `il y a ${risk.lastInterventionDaysAgo} jours` : "inconnu"}\n\n` +
                `Action recommandée : contacter ce client rapidement.`,
              sentByUid: CRON_ACTOR_UID,
              attachDocumentType: "none",
            });
            await db
              .collection("companies")
              .doc(companyId)
              .collection("maintenanceContracts")
              .doc(risk.contractId)
              .update({ [lastAlertField]: now.toISOString() });
            stats.churnAlerts++;
          } catch {
            stats.errors++;
          }
        }
      }
    } catch {
      stats.errors++;
    }
  }

  return NextResponse.json({ ok: true, ...stats, companies: companiesSnap.size });
}
