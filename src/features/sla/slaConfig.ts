export type SlaPriority = "low" | "medium" | "high" | "urgent";

export interface SlaRule {
  /** Délai max avant prise en charge (assignation), en heures. */
  responseHours: number;
  /** Délai max avant clôture, en heures. */
  completionHours: number;
}

export const SLA_RULES: Record<SlaPriority, SlaRule> = {
  low: { responseHours: 72, completionHours: 168 },
  medium: { responseHours: 24, completionHours: 72 },
  high: { responseHours: 8, completionHours: 24 },
  urgent: { responseHours: 2, completionHours: 8 },
};

export const PRIORITY_LABELS: Record<SlaPriority, string> = {
  low: "Faible",
  medium: "Moyen",
  high: "Élevé",
  urgent: "Urgent",
};
