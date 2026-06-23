import type { UnifiedDrawerTab } from "@/features/interventions";
import type { Intervention } from "@/features/interventions";

export type CaseHubAlertTone = "rose" | "amber" | "sky" | "violet" | "emerald";

export type CaseHubAlert = {
  id: string;
  tone: CaseHubAlertTone;
  labelKey: string;
  detail?: string;
};

export type CaseHubInsightTone = "rose" | "amber" | "emerald" | "sky" | "violet" | "slate";

export type CaseHubInsight = {
  id: string;
  tone: CaseHubInsightTone;
  labelKey: string;
  /** Valeur formatée à afficher en gros (ex. "4 j", "210 €", "3×"). */
  value: string;
  /** Précision additionnelle facultative (clé i18n ou texte libre via `detail`). */
  detailKey?: string;
  detail?: string;
};

export type CaseHubDetailSnapshot = {
  clientName: string;
  shortId: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  scheduleLabel: string | null;
  problemPreview: string | null;
  billingCents: number;
  commissionCents: number;
  hasBillingLines: boolean;
  paymentStatus: Intervention["paymentStatus"];
  paymentLinkUrl: string | null;
  whatsapp: string | null;
  invoicePdfUrl: string | null;
  hasAudio: boolean;
  canAssignTechnician: boolean;
  clientRating: number | null;
  clientComment: string | null;
  drawerTabBadges: Partial<Record<UnifiedDrawerTab, number>>;
  alerts: CaseHubAlert[];
  insights: CaseHubInsight[];
};
