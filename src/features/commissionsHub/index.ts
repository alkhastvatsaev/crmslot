/**
 * API publique commissionsHub — slot pager, KPIs patron et taux techniciens.
 * Moteur Firestore → voir commissions/.
 */
export { COMMISSIONS_HUB_SLOT_INDEX } from "@/features/commissionsHub/commissionsHubConstants";
export type {
  PatronCommissionKpis,
  PatronMonthlyPoint,
  PatronTechnicianRow,
  PatronTrend,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
export {
  buildPatronCommissionKpis,
  buildPatronMonthlySeries,
  buildPatronTrend,
  buildPatronTechnicianRows,
  computeTechnicianCommissionPreviewCents,
  findCompanyGroupRule,
  findPersonalTechnicianRule,
  formatRuleShort,
  resolveTechnicianDisplayRule,
  resolveTechnicianPayablePreviewCents,
  resolveTechnicianRateValue,
} from "@/features/commissionsHub/commissionsHubPatronMetrics";
export {
  monthKeyFromDate,
  parseMonthKey,
  interventionCommissionMonth,
  interventionRevenueMonth,
  interventionTechnicianRevenueCents,
  manualEntryMonth,
} from "@/features/commissionsHub/commissionsHubPatronMonthKeys";
export {
  formatCommissionValue,
  formatPatronEuros,
} from "@/features/commissionsHub/commissionsHubFormat";
export type { CommissionsHubSelection } from "@/features/commissionsHub/commissionsHubTypes";
export { useCommissionsHubData } from "@/features/commissionsHub/hooks/useCommissionsHubData";
export { default as CommissionsHubPage } from "@/features/commissionsHub/components/CommissionsHubPage";
