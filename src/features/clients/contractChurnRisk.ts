import type { Intervention } from "@/features/interventions";
import type { MaintenanceContract } from "@/features/maintenance";
import { computeSlaStatus } from "@/features/sla/computeSla";

export type ChurnRiskLevel = "safe" | "watch" | "at_risk";

export interface ContractChurnRiskResult {
  contractId: string;
  clientId: string;
  contractLabel: string;
  riskLevel: ChurnRiskLevel;
  /** 0 = pas de risque, 100 = churn quasi certain. */
  riskScore: number;
  riskFactors: string[];
  /** Jours avant la prochaine échéance (négatif = en retard). */
  daysUntilNextDue: number;
  lastInterventionDaysAgo: number | null;
  slaBreachCount30d: number;
  completedInterventions30d: number;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

export function computeContractChurnRisks(
  contracts: MaintenanceContract[],
  interventions: Intervention[],
  now: Date = new Date()
): ContractChurnRiskResult[] {
  const cutoff30 = new Date(now.getTime() - THIRTY_DAYS_MS).toISOString();
  const cutoff60 = new Date(now.getTime() - SIXTY_DAYS_MS).toISOString();

  return contracts
    .filter((c) => c.isActive)
    .map((contract): ContractChurnRiskResult => {
      const clientIvs = interventions.filter((iv) => iv.clientId === contract.clientId);

      // Last intervention date
      const sorted = [...clientIvs]
        .filter((iv) => iv.completedAt || iv.statusUpdatedAt || iv.createdAt)
        .sort((a, b) => {
          const da = a.completedAt ?? a.statusUpdatedAt ?? a.createdAt ?? "";
          const db = b.completedAt ?? b.statusUpdatedAt ?? b.createdAt ?? "";
          return db.localeCompare(da);
        });
      const lastIv = sorted[0];
      const lastRef = lastIv?.completedAt ?? lastIv?.statusUpdatedAt ?? lastIv?.createdAt ?? null;
      const lastInterventionDaysAgo = lastRef
        ? Math.floor((now.getTime() - new Date(lastRef).getTime()) / 86_400_000)
        : null;

      // SLA breaches in last 30 days
      const recent30 = clientIvs.filter((iv) => {
        const ref = iv.statusUpdatedAt ?? iv.createdAt ?? "";
        return ref >= cutoff30;
      });
      const slaBreachCount30d = recent30.filter((iv) => {
        const sla = computeSlaStatus(iv, now);
        return sla?.urgency === "breach";
      }).length;

      // Completed interventions in 30 days
      const completedInterventions30d = recent30.filter(
        (iv) => iv.status === "done" || iv.status === "invoiced"
      ).length;

      // Days until next due
      const daysUntilNextDue = Math.floor(
        (new Date(contract.nextDueDate).getTime() - now.getTime()) / 86_400_000
      );

      // Cancelled interventions in 60d
      const cancelled60d = clientIvs.filter(
        (iv) => iv.status === "cancelled" && (iv.statusUpdatedAt ?? "") >= cutoff60
      ).length;

      // Risk factor scoring
      const riskFactors: string[] = [];
      let score = 0;

      if (slaBreachCount30d >= 2) {
        score += 35;
        riskFactors.push(`${slaBreachCount30d} dépassements SLA (30j)`);
      } else if (slaBreachCount30d === 1) {
        score += 15;
        riskFactors.push("1 dépassement SLA (30j)");
      }

      if (lastInterventionDaysAgo !== null && lastInterventionDaysAgo > 45) {
        score += 20;
        riskFactors.push(`Dernière intervention il y a ${lastInterventionDaysAgo}j`);
      }

      if (daysUntilNextDue < 0) {
        score += 25;
        riskFactors.push(`Échéance dépassée de ${Math.abs(daysUntilNextDue)}j`);
      } else if (daysUntilNextDue <= 14) {
        score += 10;
        riskFactors.push(`Échéance dans ${daysUntilNextDue}j`);
      }

      if (cancelled60d >= 2) {
        score += 20;
        riskFactors.push(`${cancelled60d} interventions annulées (60j)`);
      }

      if (completedInterventions30d === 0 && recent30.length > 0) {
        score += 10;
        riskFactors.push("Aucune intervention terminée ce mois");
      }

      const riskLevel: ChurnRiskLevel = score >= 50 ? "at_risk" : score >= 25 ? "watch" : "safe";

      return {
        contractId: contract.id,
        clientId: contract.clientId,
        contractLabel: contract.label,
        riskLevel,
        riskScore: Math.min(100, score),
        riskFactors,
        daysUntilNextDue,
        lastInterventionDaysAgo,
        slaBreachCount30d,
        completedInterventions30d,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore);
}

export const CHURN_RISK_LABELS: Record<ChurnRiskLevel, string> = {
  at_risk: "🔴 À risque",
  watch: "🟡 À surveiller",
  safe: "🟢 Stable",
};
