import type { Intervention } from "@/features/interventions";

export interface TechnicianPerformanceScore {
  technicianUid: string;
  /** 0–100 — % interventions terminées / assignées (30 derniers jours). */
  completionRate: number;
  /** Ticket moyen facturé en centimes (30 derniers jours). */
  avgTicketCents: number;
  /** Revenu total généré sur 30 jours en centimes. */
  revenueCents30d: number;
  /** Nombre d'interventions terminées sur 30 jours. */
  completedCount30d: number;
  /** Temps moyen de réponse en minutes (acceptation de la mission). */
  avgResponseMinutes: number | null;
  /** Score composite 0–100 pour tri IA (proximity + completion + revenue). */
  compositeScore: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function computeTechnicianPerformanceScores(
  interventions: Intervention[],
  technicianUids: string[]
): Map<string, TechnicianPerformanceScore> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
  const result = new Map<string, TechnicianPerformanceScore>();

  for (const uid of technicianUids) {
    const assigned = interventions.filter((iv) => iv.assignedTechnicianUid === uid);
    const recent = assigned.filter((iv) => {
      const ref = iv.completedAt ?? iv.statusUpdatedAt ?? iv.createdAt ?? "";
      return ref >= cutoff;
    });
    const completed = recent.filter((iv) => iv.status === "done" || iv.status === "invoiced");

    const completionRate =
      recent.length > 0 ? Math.round((completed.length / recent.length) * 100) : 50;

    const revenueCents30d = completed.reduce((acc, iv) => acc + (iv.invoiceAmountCents ?? 0), 0);
    const avgTicketCents =
      completed.length > 0 ? Math.round(revenueCents30d / completed.length) : 0;

    const responseTimes: number[] = [];
    for (const iv of assigned) {
      if (iv.createdAt && iv.technicianAcceptedAt) {
        const diff = new Date(iv.technicianAcceptedAt).getTime() - new Date(iv.createdAt).getTime();
        if (diff > 0) responseTimes.push(diff / 60_000);
      }
    }
    const avgResponseMinutes =
      responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : null;

    // Composite: 50% completion, 30% revenue (capped at 200€ avg = 100pts), 20% response speed
    const revenueScore = Math.min(100, Math.round((avgTicketCents / 20000) * 100));
    const responseScore =
      avgResponseMinutes === null
        ? 50
        : Math.max(0, Math.min(100, 100 - Math.round(avgResponseMinutes / 2)));
    const compositeScore = Math.round(
      0.5 * completionRate + 0.3 * revenueScore + 0.2 * responseScore
    );

    result.set(uid, {
      technicianUid: uid,
      completionRate,
      avgTicketCents,
      revenueCents30d,
      completedCount30d: completed.length,
      avgResponseMinutes,
      compositeScore,
    });
  }

  return result;
}

export function formatCompositeScore(score: number): string {
  if (score >= 80) return "⭐ Top";
  if (score >= 60) return "Bon";
  if (score >= 40) return "Moyen";
  return "Faible";
}
