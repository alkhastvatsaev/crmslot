import type { MaintenanceContract } from "./types";
import { FREQUENCY_DAYS } from "./types";

export interface InterventionDraft {
  companyId: string;
  clientId: string;
  siteId?: string | null;
  title: string;
  category?: "serrurerie" | "autre";
  problem?: string;
  estimatedDurationMinutes?: number;
  status: "pending";
  /** ISO date string. */
  scheduledDate: string;
  /** Référence au contrat source. */
  sourceContractId: string;
}

/** Returns the next due date for a contract (ISO string). */
export function computeNextDueDate(contract: MaintenanceContract): string {
  const days = FREQUENCY_DAYS[contract.frequency];
  const base = new Date(contract.nextDueDate);
  base.setDate(base.getDate() + days);
  return base.toISOString().slice(0, 10);
}

/** Returns contracts whose nextDueDate is today or earlier. */
export function findDueContracts(
  contracts: MaintenanceContract[],
  today: Date = new Date(),
): MaintenanceContract[] {
  const todayStr = today.toISOString().slice(0, 10);
  return contracts.filter((c) => c.isActive && c.nextDueDate <= todayStr);
}

/** Builds an Intervention draft from a due contract. */
export function buildInterventionDraft(contract: MaintenanceContract): InterventionDraft {
  return {
    companyId: contract.companyId,
    clientId: contract.clientId,
    siteId: contract.siteId ?? null,
    title: contract.interventionTemplate.title,
    category: contract.interventionTemplate.category,
    problem: contract.interventionTemplate.problem,
    estimatedDurationMinutes: contract.interventionTemplate.estimatedDurationMinutes,
    status: "pending",
    scheduledDate: contract.nextDueDate,
    sourceContractId: contract.id,
  };
}
