/**
 * API publique scheduling — créneaux proposés, conflits, drag-board inbox.
 */
export {
  findTechnicianScheduleConflicts,
  candidateRangeFromScheduleFields,
} from "@/features/scheduling/scheduleConflicts";
export type {
  ScheduleConflict,
  FindScheduleConflictsParams,
} from "@/features/scheduling/scheduleConflicts";
export {
  proposeAvailableSlotsForTechnician,
  proposeCompanyOpenSlots,
} from "@/features/scheduling/proposeAvailableSlots";
export type { ProposedSlot, ProposeSlotsParams } from "@/features/scheduling/proposeAvailableSlots";
export {
  SCHEDULING_WORK_SLOTS,
  SCHEDULING_DEFAULT_DURATION_MS,
  SCHEDULING_BLOCKING_STATUSES,
} from "@/features/scheduling/schedulingConstants";
export {
  getInterventionOccupiedRange,
  interventionBlocksSchedule,
  rangesOverlap,
} from "@/features/scheduling/interventionOccupiedRange";
export type { OccupiedTimeRange } from "@/features/scheduling/interventionOccupiedRange";
export { pickRecommendedSlot } from "@/features/scheduling/pickRecommendedSlot";
export {
  resolveSmartAssignmentSchedule,
  initialAssignmentDateYmd,
  parseScheduleSlotStartMs,
  isScheduleSlotInPast,
  addDaysYmd,
  SMART_ASSIGNMENT_HORIZON_DAYS,
} from "@/features/scheduling/resolveSmartAssignmentSchedule";
export type { SmartAssignmentScheduleResult } from "@/features/scheduling/resolveSmartAssignmentSchedule";
export { updateInterventionSchedule } from "@/features/scheduling/updateInterventionSchedule";
export type {
  UpdateInterventionScheduleParams,
  UpdateInterventionScheduleResult,
} from "@/features/scheduling/updateInterventionSchedule";
export { default as ProposedScheduleSlots } from "@/features/scheduling/components/ProposedScheduleSlots";
export { default as ScheduleConflictBanner } from "@/features/scheduling/components/ScheduleConflictBanner";
export { default as ScheduleDragBoard } from "@/features/scheduling/components/ScheduleDragBoard";
