export type MaintenanceFrequency = "weekly" | "monthly" | "quarterly" | "biannual" | "yearly";

export interface MaintenanceContractTemplate {
  title: string;
  category?: "serrurerie" | "autre";
  problem?: string;
  estimatedDurationMinutes?: number;
}

export interface MaintenanceContract {
  id: string;
  companyId: string;
  clientId: string;
  siteId?: string | null;
  label: string;
  frequency: MaintenanceFrequency;
  /** ISO date — date de la prochaine intervention à générer. */
  nextDueDate: string;
  interventionTemplate: MaintenanceContractTemplate;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdByUid?: string | null;
}

export const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  biannual: "Semestriel",
  yearly: "Annuel",
};

export const FREQUENCY_DAYS: Record<MaintenanceFrequency, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 91,
  biannual: 182,
  yearly: 365,
};
