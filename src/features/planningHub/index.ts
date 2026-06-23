/**
 * API publique planningHub — hub Planning (slot 8), vue jour techniciens.
 * UI slot pager → `PlanningHubPage`.
 */
export { default as PlanningHubPage } from "@/features/planningHub/components/PlanningHubPage";
export { PLANNING_HUB_SLOT_INDEX } from "@/features/planningHub/planningHubConstants";
export {
  buildPlanningHubKpis,
  buildPlanningTechnicianRows,
  buildPlanningSlotsForTechnician,
  buildPlanningPendingRows,
  findInterventionById,
  PLANNING_WORK_SLOTS,
} from "@/features/planningHub/planningHubPatronMetrics";
export type { PlanningHubKpis } from "@/features/planningHub/planningHubPatronMetrics";
export type {
  PlanningSlotKind,
  PlanningHubSlot,
  PlanningTechnicianRow,
  PlanningPendingRow,
} from "@/features/planningHub/planningHubTypes";
export {
  buildClientIntakeFields,
  buildTechnicianReportFields,
  clientIntakePhotoUrls,
  technicianCompletionPhotoUrls,
  technicianSignatureUrl,
} from "@/features/planningHub/planningInterventionDetailFields";
export type { PlanningDetailField } from "@/features/planningHub/planningInterventionDetailFields";
export { usePlanningHubData } from "@/features/planningHub/hooks/usePlanningHubData";
