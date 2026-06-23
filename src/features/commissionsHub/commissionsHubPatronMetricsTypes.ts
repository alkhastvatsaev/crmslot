import type { CommissionRule } from "@/features/commissions";

export type PatronCommissionKpis = {
  monthTotalCents: number;
  monthMissionCents: number;
  monthManualCents: number;
  monthRevenueCents: number;
  activeTechnicianCount: number;
  exceptionRuleCount: number;
};

export type PatronMonthlyPoint = {
  monthKey: string;
  label: string;
  commissionCents: number;
  revenueCents: number;
};

export type PatronTrend = {
  currentCents: number;
  previousCents: number;
  deltaPct: number | null;
};

export type PatronTechnicianRow = {
  uid: string;
  name: string;
  initial: string;
  alternateTargetIds: string[];
  monthEarnedCents: number;
  monthRevenueCents: number;
  revenueMissionCount: number;
  missionCount: number;
  manualBonusCents: number;
  personalRule: CommissionRule | null;
  displayRule: CommissionRule | null;
  hasPersonalRule: boolean;
};
