/**
 * API publique calendar — plages horaires intervention pour scheduling/ICS.
 */
export {
  getInterventionScheduledRange,
  interventionScheduledLocalDayKey,
  interventionHasScheduledSlot,
} from "@/features/calendar/interventionScheduleRange";
export {
  CALENDAR_DEFAULT_EVENT_DURATION_MS,
  CALENDAR_INTEGRATION_SLOT_INDEX,
} from "@/features/calendar/calendarConstants";
