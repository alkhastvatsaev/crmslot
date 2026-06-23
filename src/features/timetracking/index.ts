/**
 * API publique timetracking — pointage technicien, export paie CSV.
 */
export type { TimeEntry, TimeEntryType } from "@/features/timetracking/types";
export {
  TIME_ENTRY_LABELS,
  computeDurationMinutes,
  formatDuration,
  totalDurationByType,
} from "@/features/timetracking/types";
export {
  subscribeCompanyTimeEntries,
  subscribeTimeEntries,
  subscribeTimeEntriesByIntervention,
  startTimeEntry,
  stopTimeEntry,
} from "@/features/timetracking/timetrackingFirestore";
export { logCrmTimeEntryRecorded } from "@/features/timetracking/logCrmTimeEntryRecorded";
export {
  defaultTimeEntryTypeForStatus,
  autoStartTimeEntryType,
  statusTransitionForTimeEntryStart,
  statusTransitionAfterTravelStop,
  buildTimeEntryCrmNote,
} from "@/features/timetracking/timeEntryMissionAutomation";
export {
  downloadPayrollCsv,
  timeEntriesToPayrollRows,
  payrollRowsToCsv,
} from "@/features/timetracking/exportPayrollCsv";
export type { PayrollRow } from "@/features/timetracking/exportPayrollCsv";
export {
  useTimeEntries,
  useCompanyTimeEntries,
  useInterventionTimeEntries,
} from "@/features/timetracking/hooks/useTimeEntries";
export { useMissionTimeTrackingAutomation } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";
export type { MissionTimeTrackingIntervention } from "@/features/timetracking/hooks/useMissionTimeTrackingAutomation";
